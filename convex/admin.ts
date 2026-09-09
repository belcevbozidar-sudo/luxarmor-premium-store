import { internalMutation, query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { ADMIN_LOCK_KEY, ADMIN_TTL, adminMutation, digest, requireAdmin } from "./security";

// The fixed server-owned key prevents lockout bypass via a new fingerprint.
// Only authActions can supply a cryptographically generated session hash.
export const verifyAdminPassword = internalMutation({
  args: { password: v.string(), sessionHash: v.string() },
  returns: v.object({ success: v.boolean(), error: v.optional(v.string()), lockedUntil: v.optional(v.number()), expiresAt: v.optional(v.number()) }),
  handler: async (ctx, args) => {
    const password = process.env.ADMIN_PASSWORD;
    if (!password || password.length < 16) throw new Error("Admin login is not configured securely");
    const now = Date.now();
    const lock = await ctx.db.query("adminLocks")
      .withIndex("by_fingerprint", q => q.eq("fingerprint", ADMIN_LOCK_KEY)).unique();
    if (lock && lock.lockedUntil > now) return { success: false, error: "Твърде много опити. Опитайте по-късно.", lockedUntil: lock.lockedUntil };
    if (await digest(args.password) !== await digest(password)) {
      const failedCount = lock?.lockedUntil ? 1 : (lock?.failedCount ?? 0) + 1;
      const lockedUntil = failedCount >= 5 ? now + 15 * 60 * 1000 : 0;
      const data = { failedCount, lockedUntil };
      if (lock) await ctx.db.patch(lock._id, data);
      else await ctx.db.insert("adminLocks", { fingerprint: ADMIN_LOCK_KEY, ...data });
      return { success: false, error: "Невалидна парола.", ...(lockedUntil ? { lockedUntil } : {}) };
    }
    const expiresAt = now + ADMIN_TTL;
    const data = { failedCount: 0, lockedUntil: 0, sessionHash: args.sessionHash, sessionExpiresAt: expiresAt, passwordVersion: await digest(password) };
    if (lock) await ctx.db.patch(lock._id, data);
    else await ctx.db.insert("adminLocks", { fingerprint: ADMIN_LOCK_KEY, ...data });
    await ctx.scheduler.runAfter(ADMIN_TTL, internal.admin.expireSession, { sessionHash: args.sessionHash });
    return { success: true, expiresAt };
  },
});

export const expireSession = internalMutation({
  args: { sessionHash: v.string() }, returns: v.null(),
  handler: async (ctx, args) => {
    const lock = await ctx.db.query("adminLocks")
      .withIndex("by_fingerprint", q => q.eq("fingerprint", ADMIN_LOCK_KEY)).unique();
    if (lock?.sessionHash === args.sessionHash && (lock.sessionExpiresAt ?? 0) <= Date.now()) {
      await ctx.db.patch(lock._id, { sessionHash: undefined, sessionExpiresAt: undefined });
    }
    return null;
  },
});

export const getLockStatus = query({
  args: { fingerprint: v.optional(v.string()) },
  returns: v.object({ isLocked: v.boolean(), lockedUntil: v.optional(v.number()) }),
  handler: async ctx => {
    const lock = await ctx.db.query("adminLocks")
      .withIndex("by_fingerprint", q => q.eq("fingerprint", ADMIN_LOCK_KEY)).unique();
    return lock && lock.lockedUntil > Date.now()
      ? { isLocked: true, lockedUntil: lock.lockedUntil } : { isLocked: false };
  },
});

export const getSession = query({
  args: { adminToken: v.string() },
  returns: v.object({ expiresAt: v.number() }),
  handler: async (ctx, args) => {
    const lock = await requireAdmin(ctx, args.adminToken);
    return { expiresAt: lock.sessionExpiresAt! };
  },
});

export const logout = adminMutation({
  args: {}, returns: v.null(),
  handler: async ctx => {
    const lock = await ctx.db.query("adminLocks")
      .withIndex("by_fingerprint", q => q.eq("fingerprint", ADMIN_LOCK_KEY)).unique();
    if (lock) await ctx.db.patch(lock._id, { sessionHash: undefined, sessionExpiresAt: undefined });
    return null;
  },
});
