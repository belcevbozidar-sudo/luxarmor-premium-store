import { internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { adminQuery, authResultValidator, digest, profileValidator, registrationFields, safeProfile, USER_TTL } from "./security";

export const register = internalMutation({
  args: { email: v.string(), passwordHash: v.string(), sessionHash: v.string(), ...registrationFields },
  returns: authResultValidator,
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("users").withIndex("by_email", q => q.eq("email", args.email)).first();
    if (existing) throw new Error("Регистрацията не може да бъде завършена.");
    const { sessionHash, ...data } = args;
    const userId = await ctx.db.insert("users", {
      ...data, googleId: null, sessionToken: sessionHash,
      sessionExpiresAt: Date.now() + USER_TTL, createdAt: new Date().toISOString(),
    });
    await ctx.scheduler.runAfter(USER_TTL, internal.users.expireSession, { userId, sessionHash });
    return { success: true, userId, clientType: args.clientType, name: args.name };
  },
});

// Unknown addresses share one bounded record; probes never allocate per-email rows.
export const checkLoginAttempt = internalMutation({
  args: { userId: v.union(v.id("users"), v.null()) },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const key = args.userId ?? "unknown";
    const row = await ctx.db.query("loginFailures").withIndex("by_key", q => q.eq("key", key)).unique();
    if (row && row.expiresAt <= Date.now()) {
      await ctx.db.delete(row._id);
      return true;
    }
    return !row || row.failedCount < 10;
  },
});

export const recordLoginFailure = internalMutation({
  args: { userId: v.union(v.id("users"), v.null()) }, returns: v.null(),
  handler: async (ctx, args) => {
    const key = args.userId ?? "unknown";
    const row = await ctx.db.query("loginFailures").withIndex("by_key", q => q.eq("key", key)).unique();
    const fresh = !row || row.expiresAt <= Date.now();
    const data = { failedCount: fresh ? 1 : Math.min(10, row.failedCount + 1),
      expiresAt: fresh ? Date.now() + 15 * 60 * 1000 : row.expiresAt };
    if (row) await ctx.db.patch(row._id, data);
    else await ctx.db.insert("loginFailures", { key, ...data });
    return null;
  },
});

// Bounded cron batches also remove abandoned attempt records from the old implementation.
export const cleanLoginFailures = internalMutation({
  args: { cursor: v.optional(v.union(v.string(), v.null())) }, returns: v.null(),
  handler: async (ctx, args) => {
    const expired = await ctx.db.query("loginFailures")
      .withIndex("by_expiresAt", q => q.lte("expiresAt", Date.now())).take(100);
    for (const row of expired) await ctx.db.delete(row._id);
    const legacy = await ctx.db.query("adminLocks").withIndex("by_fingerprint", q =>
      q.gte("fingerprint", "security:user:").lt("fingerprint", "security:user;"))
      .paginate({ cursor: args.cursor ?? null, numItems: 100 });
    for (const row of legacy.page) {
      if (row.lockedUntil <= Date.now()) await ctx.db.delete(row._id);
    }
    if (!legacy.isDone || expired.length === 100) {
      await ctx.scheduler.runAfter(0, internal.users.cleanLoginFailures,
        { cursor: legacy.isDone ? null : legacy.continueCursor });
    }
    return null;
  },
});

export const credentials = internalQuery({
  args: { email: v.string() },
  returns: v.union(v.null(), v.object({ userId: v.id("users"), passwordHash: v.union(v.string(), v.null()) })),
  handler: async (ctx, args) => {
    // Preserve exact-case legacy email login without a data migration.
    const exact = await ctx.db.query("users").withIndex("by_email", q => q.eq("email", args.email.trim())).first();
    const user = exact ?? await ctx.db.query("users")
      .withIndex("by_email", q => q.eq("email", args.email.trim().toLowerCase())).first();
    return user ? { userId: user._id, passwordHash: user.passwordHash } : null;
  },
});

export const login = internalMutation({
  args: { userId: v.id("users"), expectedHash: v.string(), passwordHash: v.string(), sessionHash: v.string() },
  returns: authResultValidator,
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user || user.passwordHash !== args.expectedHash) throw new Error("Невалиден вход.");
    const failure = await ctx.db.query("loginFailures").withIndex("by_key", q => q.eq("key", user._id)).unique();
    if (failure) await ctx.db.delete(failure._id);
    await ctx.db.patch(user._id, {
      passwordHash: args.passwordHash, sessionToken: args.sessionHash, sessionExpiresAt: Date.now() + USER_TTL,
    });
    await ctx.scheduler.runAfter(USER_TTL, internal.users.expireSession, { userId: user._id, sessionHash: args.sessionHash });
    return { success: true, userId: user._id, clientType: user.clientType, name: user.name };
  },
});

// Old rows have no normalized-email index. Bounded pages let the verified action
// find mixed-case legacy/password accounts without a destructive data migration.
export const lookupGoogleEmail = internalQuery({
  args: { email: v.string(), cursor: v.union(v.string(), v.null()) },
  returns: v.object({ userId: v.union(v.id("users"), v.null()), isDone: v.boolean(), continueCursor: v.string() }),
  handler: async (ctx, args) => {
    const email = args.email.trim().toLowerCase();
    if (args.cursor === null) {
      const exact = await ctx.db.query("users").withIndex("by_email", q => q.eq("email", email)).first();
      if (exact) return { userId: exact._id, isDone: true, continueCursor: "" };
    }
    const page = await ctx.db.query("users").paginate({ cursor: args.cursor, numItems: 100 });
    const match = page.page.find(user => user.email.trim().toLowerCase() === email);
    return { userId: match?._id ?? null, isDone: !!match || page.isDone, continueCursor: page.continueCursor };
  },
});

// Identity fields arrive only from the server's verified Google JWT.
export const googleLogin = internalMutation({
  args: {
    email: v.string(), name: v.string(), googleId: v.string(), sessionHash: v.string(),
    emailUserId: v.optional(v.id("users")),
    registration: v.optional(v.object(registrationFields)),
  },
  returns: authResultValidator,
  handler: async (ctx, args) => {
    const verifiedUser = await ctx.db.query("users")
      .withIndex("by_verified_google", q => q.eq("googleId", args.googleId).eq("googleVerified", true)).unique();
    const email = args.email.trim().toLowerCase();
    const emailUser = args.emailUserId ? await ctx.db.get(args.emailUserId)
      : await ctx.db.query("users").withIndex("by_email", q => q.eq("email", email)).first();
    if (args.emailUserId && (!emailUser || emailUser.email.trim().toLowerCase() !== email)) {
      throw new Error("Профилът изисква потвърдено възстановяване.");
    }
    // Prefix index lookup also finds mixed-case legacy email records by their Google sub.
    const legacyCandidates = verifiedUser || emailUser ? [] : await ctx.db.query("users")
      .withIndex("by_verified_google", q => q.eq("googleId", args.googleId)).take(2);
    if (legacyCandidates.length > 1) throw new Error("Профилът изисква потвърдено възстановяване.");
    const user = verifiedUser ?? emailUser ?? legacyCandidates[0];
    if (user) {
      const safeLegacyUpgrade = !user.googleVerified && user.passwordHash === null
        && !!user.googleId && user.googleId === args.googleId
        && user.email.trim().toLowerCase() === email;
      if ((!user.googleVerified && !safeLegacyUpgrade) || user.googleId !== args.googleId
        || user.passwordHash !== null) {
        throw new Error("Този профил изисква вход с парола или потвърдено възстановяване. Автоматично свързване с Google не е разрешено.");
      }
      await ctx.db.patch(user._id, { googleVerified: true, sessionToken: args.sessionHash, sessionExpiresAt: Date.now() + USER_TTL });
      await ctx.scheduler.runAfter(USER_TTL, internal.users.expireSession, { userId: user._id, sessionHash: args.sessionHash });
      return { success: true, userId: user._id, clientType: user.clientType, name: user.name };
    }
    if (!args.registration) return { needsRegistration: true, email: args.email, name: args.name };
    const userId = await ctx.db.insert("users", {
      ...args.registration, name: args.name, email: args.email, passwordHash: null,
      googleId: args.googleId, googleVerified: true, sessionToken: args.sessionHash,
      sessionExpiresAt: Date.now() + USER_TTL, createdAt: new Date().toISOString(),
    });
    await ctx.scheduler.runAfter(USER_TTL, internal.users.expireSession, { userId, sessionHash: args.sessionHash });
    return { success: true, userId, clientType: args.registration.clientType, name: args.name };
  },
});

export const expireSession = internalMutation({
  args: { userId: v.id("users"), sessionHash: v.string() }, returns: v.null(),
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (user?.sessionToken === args.sessionHash && (user.sessionExpiresAt ?? 0) <= Date.now()) {
      await ctx.db.patch(user._id, { sessionToken: null, sessionExpiresAt: undefined });
    }
    return null;
  },
});

export const getProfile = query({
  args: { sessionToken: v.string() },
  returns: v.union(v.null(), profileValidator),
  handler: async (ctx, args) => {
    if (!/^ck2_user_[a-f0-9]{64}$/.test(args.sessionToken)) return null;
    const hash = await digest(args.sessionToken);
    const user = await ctx.db.query("users").withIndex("by_session", q => q.eq("sessionToken", hash)).unique();
    if (!user || !user.sessionExpiresAt || user.sessionExpiresAt <= Date.now()) return null;
    return safeProfile(user);
  },
});

export const logout = mutation({
  args: { sessionToken: v.string() }, returns: v.null(),
  handler: async (ctx, args) => {
    if (!/^ck2_user_[a-f0-9]{64}$/.test(args.sessionToken)) return null;
    const hash = await digest(args.sessionToken);
    const user = await ctx.db.query("users").withIndex("by_session", q => q.eq("sessionToken", hash)).unique();
    if (user) await ctx.db.patch(user._id, { sessionToken: null, sessionExpiresAt: undefined });
    return null;
  },
});

export const get = adminQuery({
  args: { cursor: v.optional(v.union(v.string(), v.null())) },
  returns: v.object({ page: v.array(profileValidator), isDone: v.boolean(), continueCursor: v.string() }),
  handler: async (ctx, args) => {
    const result = await ctx.db.query("users").order("desc").paginate({ cursor: args.cursor ?? null, numItems: 100 });
    return { page: result.page.map(safeProfile), isDone: result.isDone, continueCursor: result.continueCursor };
  },
});
