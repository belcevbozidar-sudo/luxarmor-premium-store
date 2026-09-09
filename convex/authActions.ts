"use node";
import { randomBytes, scryptSync, createHash, timingSafeEqual } from "node:crypto";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { authResultValidator, registrationFields } from "./security";

const googleKeys = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));
const sha = (value: string) => createHash("sha256").update(value).digest("hex");
const token = (kind: string) => "ck2_" + kind + "_" + randomBytes(32).toString("hex");
const scryptOptions = { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
function passwordHash(password: string) {
  const salt = randomBytes(16).toString("hex");
  return "scrypt$" + salt + "$" + scryptSync(password, salt, 64, scryptOptions).toString("hex");
}
function checkPassword(password: string, stored: string) {
  if (stored.startsWith("scrypt$")) {
    const [, salt, expected] = stored.split("$");
    if (!/^[a-f0-9]{32}$/.test(salt ?? "") || !/^[a-f0-9]{128}$/.test(expected ?? "")) return false;
    return timingSafeEqual(scryptSync(password, salt, 64, scryptOptions), Buffer.from(expected, "hex"));
  }
  // Upgrade existing SHA-256 passwords after a successful password login.
  return /^[a-f0-9]{64}$/.test(stored) && timingSafeEqual(Buffer.from(sha(password), "hex"), Buffer.from(stored, "hex"));
}

export const adminLogin = action({
  args: { password: v.string() },
  returns: v.object({ success: v.boolean(), token: v.optional(v.string()), error: v.optional(v.string()), lockedUntil: v.optional(v.number()), expiresAt: v.optional(v.number()) }),
  handler: async (ctx, args) => {
    if (args.password.length > 1024) throw new Error("Невалиден вход.");
    const sessionToken = token("admin");
    const result = await ctx.runMutation(internal.admin.verifyAdminPassword, { password: args.password, sessionHash: sha(sessionToken) });
    return result.success ? { ...result, token: sessionToken } : result;
  },
});

export const register = action({
  args: { email: v.string(), password: v.string(), ...registrationFields },
  returns: authResultValidator,
  handler: async (ctx, args) => {
    const email = args.email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254
      || args.password.length < 12 || args.password.length > 256) throw new Error("Въведете валиден имейл и парола от 12 до 256 символа.");
    if (!args.name.trim() || !args.phone.trim() || !args.address.trim()) throw new Error("Попълнете данните за профила.");
    if (!await ctx.runMutation(internal.users.reserveLoginAttempt, { email })) throw new Error("Твърде много опити.");
    const sessionToken = token("user");
    const { password, ...data } = args;
    const result = await ctx.runMutation(internal.users.register, {
      ...data, email, passwordHash: passwordHash(password), sessionHash: sha(sessionToken),
    });
    return { ...result, sessionToken };
  },
});

export const login = action({
  args: { email: v.string(), password: v.string() },
  returns: authResultValidator,
  handler: async (ctx, args) => {
    if (args.email.length > 254 || args.password.length > 256) throw new Error("Невалиден имейл или парола.");
    if (!await ctx.runMutation(internal.users.reserveLoginAttempt, { email: args.email })) throw new Error("Твърде много опити. Опитайте след 15 минути.");
    const user = await ctx.runQuery(internal.users.credentials, { email: args.email });
    if (!user?.passwordHash || !checkPassword(args.password, user.passwordHash)) throw new Error("Невалиден имейл или парола.");
    const sessionToken = token("user");
    const result = await ctx.runMutation(internal.users.login, {
      userId: user.userId, expectedHash: user.passwordHash,
      passwordHash: user.passwordHash.startsWith("scrypt$") ? user.passwordHash : passwordHash(args.password),
      sessionHash: sha(sessionToken),
    });
    return { ...result, sessionToken };
  },
});

export const googleLogin = action({
  args: { credential: v.string(), registration: v.optional(v.object(registrationFields)) },
  returns: authResultValidator,
  handler: async (ctx, args) => {
    const audience = process.env.GOOGLE_CLIENT_ID;
    if (audience !== "70942273013-gfa27k4l90vr567srhdg978l7oip6jst.apps.googleusercontent.com") {
      throw new Error("GOOGLE_CLIENT_ID must match the current CaseKing Google Web Client ID");
    }
    if (args.credential.length > 16384) throw new Error("Невалиден Google вход.");
    let identity;
    try {
      const { payload } = await jwtVerify(args.credential, googleKeys, {
        algorithms: ["RS256"], audience, issuer: ["https://accounts.google.com", "accounts.google.com"],
        requiredClaims: ["exp", "iat", "sub", "email", "email_verified"], maxTokenAge: "1h",
      });
      if ((payload.azp !== undefined && payload.azp !== audience)
        || payload.email_verified !== true || typeof payload.email !== "string"
        || !payload.sub || payload.sub.length > 255) throw new Error("Invalid identity");
      // Google must be authoritative for the email, not merely a third-party address.
      if (!payload.email.toLowerCase().endsWith("@gmail.com") && typeof payload.hd !== "string") throw new Error("Non-authoritative email");
      identity = { email: payload.email.toLowerCase(), googleId: payload.sub,
        name: typeof payload.name === "string" ? payload.name : payload.email };
    } catch {
      throw new Error("Невалиден или изтекъл Google вход.");
    }
    if (args.registration && (!args.registration.phone.trim() || !args.registration.address.trim())) throw new Error("Попълнете телефон и адрес.");
    const sessionToken = token("user");
    const result = await ctx.runMutation(internal.users.googleLogin, {
      ...identity, sessionHash: sha(sessionToken), ...(args.registration ? { registration: args.registration } : {}),
    });
    return result.success ? { ...result, sessionToken } : result;
  },
});
