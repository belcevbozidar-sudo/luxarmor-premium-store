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

// Increment before password verification, in a separate committed transaction.
export const reserveLoginAttempt = internalMutation({
  args: { email: v.string() },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const fingerprint = "security:user:" + await digest(args.email.trim().toLowerCase());
    const lock = await ctx.db.query("adminLocks")
      .withIndex("by_fingerprint", q => q.eq("fingerprint", fingerprint)).unique();
    const now = Date.now();
    if (lock && lock.lockedUntil > now && lock.failedCount >= 10) return false;
    const failedCount = !lock || lock.lockedUntil <= now ? 1 : lock.failedCount + 1;
    const lockedUntil = !lock || lock.lockedUntil <= now ? now + 15 * 60 * 1000 : lock.lockedUntil;
    if (lock) await ctx.db.patch(lock._id, { failedCount, lockedUntil });
    else await ctx.db.insert("adminLocks", { fingerprint, failedCount, lockedUntil });
    return true;
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
    await ctx.db.patch(user._id, {
      passwordHash: args.passwordHash, sessionToken: args.sessionHash, sessionExpiresAt: Date.now() + USER_TTL,
    });
    await ctx.scheduler.runAfter(USER_TTL, internal.users.expireSession, { userId: user._id, sessionHash: args.sessionHash });
    return { success: true, userId: user._id, clientType: user.clientType, name: user.name };
  },
});

// Identity fields arrive only from the server's verified Google JWT.
export const googleLogin = internalMutation({
  args: {
    email: v.string(), name: v.string(), googleId: v.string(), sessionHash: v.string(),
    registration: v.optional(v.object(registrationFields)),
  },
  returns: authResultValidator,
  handler: async (ctx, args) => {
    const verifiedUser = await ctx.db.query("users")
      .withIndex("by_verified_google", q => q.eq("googleId", args.googleId).eq("googleVerified", true)).unique();
    const user = verifiedUser ?? await ctx.db.query("users").withIndex("by_email", q => q.eq("email", args.email)).first();
    if (user) {
      // Never auto-link a password account or trust a legacy client-supplied googleId.
      if (!user.googleVerified || user.googleId !== args.googleId) {
        throw new Error("Този профил изисква вход с парола или потвърдено възстановяване. Автоматично свързване с Google не е разрешено.");
      }
      await ctx.db.patch(user._id, { sessionToken: args.sessionHash, sessionExpiresAt: Date.now() + USER_TTL });
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
