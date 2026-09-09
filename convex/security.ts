import { customMutation, customQuery } from "convex-helpers/server/customFunctions";
import { mutation, query, type QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";

export const ADMIN_LOCK_KEY = "security:admin:v2";
export const ADMIN_TTL = 8 * 60 * 60 * 1000;
export const USER_TTL = 7 * 24 * 60 * 60 * 1000;
export async function digest(value: string): Promise<string> {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2, "0")).join("");
}
export async function requireAdmin(ctx: Pick<QueryCtx, "db">, token: string) {
  const password = process.env.ADMIN_PASSWORD;
  if (!password || !/^ck2_admin_[a-f0-9]{64}$/.test(token)) throw new Error("Unauthorized");
  const lock = await ctx.db.query("adminLocks")
    .withIndex("by_fingerprint", q => q.eq("fingerprint", ADMIN_LOCK_KEY)).unique();
  // Server time is intentional: never trust caller-supplied expiry/time.
  if (!lock || !lock.sessionExpiresAt || lock.sessionExpiresAt <= Date.now()
    || lock.sessionHash !== await digest(token)
    || lock.passwordVersion !== await digest(password)) throw new Error("Unauthorized");
  return lock;
}
const adminAccess = {
  args: { adminToken: v.string() },
  input: async (ctx: QueryCtx, { adminToken }: { adminToken: string }) => {
    await requireAdmin(ctx, adminToken);
    // Consume the credential so handlers cannot persist it with args.
    return { ctx: {}, args: {} };
  },
};
export const adminQuery = customQuery(query, adminAccess);
export const adminMutation = customMutation(mutation, adminAccess);
// Only the five explicitly selected Koff operations use this wrapper.
// Sync credentials are consumed here, never passed into product/metadata records.
export const adminOrSyncMutation = customMutation(mutation, {
  args: { adminToken: v.optional(v.string()), syncSecret: v.optional(v.string()) },
  input: async (ctx, { adminToken, syncSecret }) => {
    if (syncSecret !== undefined) {
      const expected = process.env.CASEKING_SYNC_SECRET;
      if (!expected || expected.length < 32 || expected.length > 512
        || expected === process.env.ADMIN_PASSWORD || /^ck2_(admin|user)_/.test(expected)
        || syncSecret.length > 512 || await digest(syncSecret) !== await digest(expected)) {
        throw new Error("Unauthorized");
      }
    } else {
      await requireAdmin(ctx, adminToken ?? "");
    }
    return { ctx: {}, args: {} };
  },
});
export const companyValidator = v.object({
  name: v.string(), bulstat: v.string(), address: v.string(), mol: v.string(), vatRegistered: v.boolean(),
});
export const profileValidator = v.object({
  _id: v.id("users"), _creationTime: v.number(), email: v.string(), clientType: v.string(),
  name: v.string(), phone: v.string(), address: v.string(), createdAt: v.string(),
  companyDetails: v.optional(companyValidator),
});
export function safeProfile(user: Doc<"users">) {
  return {
    _id: user._id, _creationTime: user._creationTime, email: user.email, clientType: user.clientType,
    name: user.name, phone: user.phone, address: user.address, createdAt: user.createdAt,
    ...(user.companyDetails ? { companyDetails: user.companyDetails } : {}),
  };
}
export const authResultValidator = v.object({
  success: v.optional(v.boolean()), error: v.optional(v.string()),
  userId: v.optional(v.id("users")), sessionToken: v.optional(v.string()),
  clientType: v.optional(v.string()), name: v.optional(v.string()),
  needsRegistration: v.optional(v.boolean()), email: v.optional(v.string()),
});
export const registrationFields = {
  clientType: v.union(v.literal("B2C"), v.literal("B2B")),
  name: v.string(), phone: v.string(), address: v.string(),
  companyDetails: v.optional(companyValidator),
};
