import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const LOCKOUT_DURATION = 60 * 60 * 1000; // 60 minutes in ms

export const verifyAdminPassword = mutation({
  args: {
    password: v.string(),
    fingerprint: v.string(),
  },
  handler: async (ctx, args) => {
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
    if (!ADMIN_PASSWORD) {
      throw new Error("ADMIN_PASSWORD environment variable is not set in Convex cloud!");
    }
    const now = Date.now();

    // Check if locked out
    const lock = await ctx.db
      .query("adminLocks")
      .withIndex("by_fingerprint", (q) => q.eq("fingerprint", args.fingerprint))
      .first();

    if (lock && lock.lockedUntil > now) {
      const remainingMs = lock.lockedUntil - now;
      const remainingMins = Math.ceil(remainingMs / 60000);
      return {
        success: false,
        error: `Твърде много опити. Моля, изчакайте ${remainingMins} минути.`,
        lockedUntil: lock.lockedUntil,
        remainingMins,
      };
    }

    if (args.password === ADMIN_PASSWORD) {
      // Clear lock on success
      if (lock) {
        await ctx.db.delete(lock._id);
      }
      return {
        success: true,
        token: "CK_ADMIN_SECURE_TOKEN_" + Math.random().toString(36).substring(2, 15),
      };
    } else {
      // Increment failed attempts
      let failedCount = 1;
      let lockedUntil = 0;

      if (lock) {
        failedCount = lock.failedCount + 1;
        if (failedCount >= 3) {
          lockedUntil = now + LOCKOUT_DURATION;
        }
        await ctx.db.patch(lock._id, {
          failedCount,
          lockedUntil,
        });
      } else {
        await ctx.db.insert("adminLocks", {
          fingerprint: args.fingerprint,
          failedCount,
          lockedUntil,
        });
      }

      const attemptsLeft = Math.max(0, 3 - failedCount);
      if (attemptsLeft === 0) {
        return {
          success: false,
          error: "Твърде много опити. Достъпът е блокиран за 60 минути.",
          lockedUntil: now + LOCKOUT_DURATION,
          attemptsLeft,
        };
      } else {
        return {
          success: false,
          error: `Грешна парола. Остават ${attemptsLeft} опита.`,
          attemptsLeft,
        };
      }
    }
  },
});

export const getLockStatus = query({
  args: { fingerprint: v.string() },
  handler: async (ctx, args) => {
    const now = Date.now();
    const lock = await ctx.db
      .query("adminLocks")
      .withIndex("by_fingerprint", (q) => q.eq("fingerprint", args.fingerprint))
      .first();

    if (lock && lock.lockedUntil > now) {
      return {
        isLocked: true,
        remainingMins: Math.ceil((lock.lockedUntil - now) / 60000),
        lockedUntil: lock.lockedUntil,
      };
    }
    return { isLocked: false };
  },
});
