import { beforeEach, afterEach, describe, expect, test, vi } from "vitest";
import { convexTest } from "convex-test";
import { makeFunctionReference } from "convex/server";
import { generateKeyPair, exportJWK, SignJWT } from "jose";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import schema from "../convex/schema";
import { api, internal } from "../convex/_generated/api";
import { ADMIN_LOCK_KEY, ADMIN_TTL, USER_TTL } from "../convex/security";

const modules = import.meta.glob("../convex/**/*.ts");
const ref = (name: string) => makeFunctionReference<"action">(name);
const sha = (s: string) => createHash("sha256").update(s).digest("hex");
const adminToken = "ck2_admin_" + "a".repeat(64);
const userToken = "ck2_user_" + "b".repeat(64);
const password = "test-only-admin-password-strong";
const registration = { clientType: "B2C" as const, name: "Test", phone: "123", address: "Test address" };
const userData = {
  ...registration, email: "test@gmail.com", passwordHash: sha("legacy-password"), googleId: null,
  sessionToken: sha(userToken), sessionExpiresAt: Date.now() + USER_TTL, createdAt: new Date().toISOString(),
};
async function fixture() {
  const t = convexTest(schema, modules);
  await t.run(async ctx => {
    await ctx.db.insert("adminLocks", {
      fingerprint: ADMIN_LOCK_KEY, failedCount: 0, lockedUntil: 0,
      sessionHash: sha(adminToken), sessionExpiresAt: Date.now() + ADMIN_TTL, passwordVersion: sha(password),
    });
    await ctx.db.insert("users", userData);
    await ctx.db.insert("orders", {
      orderNumber: "PRIVATE", name: "Private customer", phone: "123", address: "Private address",
      items: [], total: 10, status: "pending", createdAt: new Date().toISOString(), clientType: "B2C",
    });
  });
  return t;
}
beforeEach(() => {
  vi.stubEnv("ADMIN_PASSWORD", password);
  vi.stubEnv("GOOGLE_CLIENT_ID", "test.apps.googleusercontent.com");
});
afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });

describe("admin and data privacy", () => {
  test("B2B customer fields render as text, never as HTML", () => {
    const source = readFileSync(new URL("../admin.js", import.meta.url), "utf8");
    const escape = source.slice(source.indexOf("function escapeHtml("), source.indexOf("function transliterateBulgarian("));
    const render = source.slice(source.indexOf("function renderB2BUsers("), source.indexOf("// --- DASHBOARD STATISTICS"));
    const payload = '<img src=x onerror="alert(1)">';
    const rows: { innerHTML: string }[] = [];
    const tbody = { innerHTML: "", appendChild: (row: { innerHTML: string }) => rows.push(row) };
    runInNewContext(escape + render + "; renderB2BUsers()", {
      allUsers: [{ clientType: "B2B", name: payload, email: payload, phone: payload, address: payload,
        companyDetails: { name: payload, bulstat: payload, mol: payload, address: payload } }],
      document: { getElementById: () => tbody, createElement: () => ({ innerHTML: "" }) },
    });
    expect(rows).toHaveLength(1);
    expect(rows[0].innerHTML).not.toContain("<img");
    expect(rows[0].innerHTML).toContain("&lt;img");
  });
  test("customer order URLs cannot execute script in the admin origin", () => {
    const source = readFileSync(new URL("../admin.js", import.meta.url), "utf8");
    const fn = source.slice(source.indexOf("function safeOrderUrl("), source.indexOf("// --- PAGINATION"));
    const check = runInNewContext(fn + "; safeOrderUrl", { URL, window: { location: { origin: "https://example.test" } } });
    for (const value of ["javascript:alert(1)", "java\nscript:alert(1)", "data:text/html,<script>alert(1)</script>", "vbscript:evil"]) {
      expect(check(value)).toBe("");
    }
    expect(check("/produkt/test")).toBe("https://example.test/produkt/test");
    expect(check("https://example.test/image.webp")).toBe("https://example.test/image.webp");
  });
  test("private data rejects missing, forged and user credentials", async () => {
    const t = await fixture();
    for (const fn of [api.users.get, api.orders.get, api.blog.getAll, api.promotions.getAll, api.promoCodes.get]) {
      await expect(t.query(fn, {} as never)).rejects.toThrow();
      for (const token of ["CK_ADMIN_SECURE_TOKEN_fake", userToken, "ck2_admin_" + "c".repeat(64)]) {
        await expect(t.query(fn, { adminToken: token })).rejects.toThrow();
      }
    }
  });
  test("admin reads paginated records but never password/session secrets", async () => {
    const t = await fixture();
    const users = await t.query(api.users.get, { adminToken });
    expect(users.page).toHaveLength(1);
    for (const key of ["passwordHash", "sessionToken", "sessionExpiresAt", "googleId", "googleVerified"]) {
      expect(users.page[0]).not.toHaveProperty(key);
    }
    expect((await t.query(api.orders.get, { adminToken })).page[0].orderNumber).toBe("PRIVATE");
  });
  test("profile is limited to the session owner and fails closed for legacy/expired sessions", async () => {
    const t = await fixture();
    const profile = await t.query(api.users.getProfile, { sessionToken: userToken });
    expect(profile?.email).toBe("test@gmail.com");
    expect(profile).not.toHaveProperty("passwordHash");
    expect(profile).not.toHaveProperty("sessionToken");
    expect(await t.query(api.users.getProfile, { sessionToken: "CK_USER_SESSION_legacy" })).toBeNull();
    await t.run(async ctx => {
      const user = await ctx.db.query("users").first();
      await ctx.db.patch(user!._id, { sessionExpiresAt: Date.now() - 1 });
    });
    expect(await t.query(api.users.getProfile, { sessionToken: userToken })).toBeNull();
  });
  test("expired sessions, password rotation and logout revoke access", async () => {
    const t = await fixture();
    vi.stubEnv("ADMIN_PASSWORD", "a-different-password-that-is-strong");
    await expect(t.query(api.orders.get, { adminToken })).rejects.toThrow("Unauthorized");
    vi.stubEnv("ADMIN_PASSWORD", password);
    await t.mutation(api.admin.logout, { adminToken });
    await expect(t.query(api.orders.get, { adminToken })).rejects.toThrow("Unauthorized");
    await t.mutation(api.users.logout, { sessionToken: userToken });
    expect(await t.query(api.users.getProfile, { sessionToken: userToken })).toBeNull();
  });
  test("expiration rejects admin reads and old cleanup jobs cannot revoke a rotated session", async () => {
    const t = await fixture();
    await t.run(async ctx => {
      const row = await ctx.db.query("adminLocks").withIndex("by_fingerprint", q => q.eq("fingerprint", ADMIN_LOCK_KEY)).unique();
      await ctx.db.patch(row!._id, { sessionExpiresAt: Date.now() - 1 });
    });
    await expect(t.query(api.orders.get, { adminToken })).rejects.toThrow("Unauthorized");
    const result = await t.action(ref("authActions:adminLogin"), { password });
    await t.mutation(internal.admin.expireSession, { sessionHash: sha(adminToken) });
    expect((await t.query(api.admin.getSession, { adminToken: result.token })).expiresAt).toBeGreaterThan(Date.now());
  });
  test("all catalog/content write exports have the same authorization guard", async () => {
    const t = await fixture();
    for (const file of ["products", "meta", "blog", "promotions", "promoCodes", "settings"]) {
      const source = readFileSync(new URL("../convex/" + file + ".ts", import.meta.url), "utf8");
      expect(source).toContain('adminMutation as mutation');
      const exports = [...source.matchAll(/export const (\w+) = mutation\(/g)].map(m => m[1]);
      expect(exports.length).toBeGreaterThan(0);
      for (const name of exports) {
        // Call the registered handler to exercise the wrapper before business logic.
        const mod = await modules["../convex/" + file + ".ts"]() as Record<string, { _handler: Function }>;
        await t.run(async ctx => {
          await expect(mod[name]._handler(ctx, { adminToken: userToken })).rejects.toThrow("Unauthorized");
        });
      }
    }
  });
  test("order changes require admin and validate status", async () => {
    const t = await fixture();
    const id = await t.run(async ctx => (await ctx.db.query("orders").first())!._id);
    await expect(t.mutation(api.orders.updateStatus, { id, status: "completed", adminToken: userToken })).rejects.toThrow();
    await expect(t.mutation(api.orders.updateStatus, { id, status: "injected" as never, adminToken })).rejects.toThrow();
    await t.mutation(api.orders.updateStatus, { id, status: "completed", adminToken });
    expect((await t.query(api.orders.get, { adminToken })).page[0].status).toBe("completed");
  });
  test("admin login issues a hashed expiring token; lockout cannot be bypassed with a fingerprint", async () => {
    const t = await fixture();
    for (let i = 0; i < 5; i++) {
      const result = await t.action(ref("authActions:adminLogin"), { password: "wrong" });
      expect(result.success).toBe(false);
    }
    expect((await t.action(ref("authActions:adminLogin"), { password })).success).toBe(false);
    const lock = await t.query(api.admin.getLockStatus, { fingerprint: "a-brand-new-browser" });
    expect(lock.isLocked).toBe(true);
    await t.run(async ctx => {
      const row = await ctx.db.query("adminLocks").withIndex("by_fingerprint", q => q.eq("fingerprint", ADMIN_LOCK_KEY)).unique();
      await ctx.db.patch(row!._id, { lockedUntil: Date.now() - 1 });
    });
    const result = await t.action(ref("authActions:adminLogin"), { password });
    expect(result.token).toMatch(/^ck2_admin_[a-f0-9]{64}$/);
    expect((await t.query(api.admin.getSession, { adminToken: result.token })).expiresAt).toBeGreaterThan(Date.now());
    await expect(t.query(api.admin.getSession, { adminToken })).rejects.toThrow();
  });
  test("legacy password login upgrades hashing and rotates the session", async () => {
    const t = await fixture();
    const result = await t.action(ref("authActions:login"), { email: userData.email, password: "legacy-password" });
    expect(result.sessionToken).toMatch(/^ck2_user_[a-f0-9]{64}$/);
    expect(await t.query(api.users.getProfile, { sessionToken: userToken })).toBeNull();
    const stored = await t.run(async ctx => await ctx.db.query("users").first());
    expect(stored!.passwordHash).toMatch(/^scrypt\$/);
    expect(stored!.sessionToken).toBe(sha(result.sessionToken));
  });
});

describe("Google server-side verification", () => {
  test("rejects tampering, wrong claims, unverified email and unauthorized linking", async () => {
    const t = await fixture();
    const { privateKey, publicKey } = await generateKeyPair("RS256");
    const jwk = await exportJWK(publicKey);
    jwk.kid = "test-key"; jwk.alg = "RS256"; jwk.use = "sig";
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ keys: [jwk] }), {
      status: 200, headers: { "Content-Type": "application/json" },
    }));
    const sign = (claims: Record<string, unknown> = {}, subject = "google-subject") => new SignJWT({
      email: "new@gmail.com", email_verified: true, name: "Verified", ...claims,
    }).setProtectedHeader({ alg: "RS256", kid: "test-key" }).setSubject(subject)
      .setIssuedAt().setExpirationTime("1h").setAudience("test.apps.googleusercontent.com")
      .setIssuer("https://accounts.google.com").sign(privateKey);
    const good = await sign();
    const preliminary = await t.action(ref("authActions:googleLogin"), { credential: good });
    expect(preliminary.needsRegistration).toBe(true);
    expect(preliminary).not.toHaveProperty("sessionToken");
    const registered = await t.action(ref("authActions:googleLogin"), { credential: good, registration });
    expect(registered.success).toBe(true);
    const changedEmail = await t.action(ref("authActions:googleLogin"), { credential: await sign({ email: "changed@gmail.com" }) });
    expect(changedEmail.userId).toBe(registered.userId);
    for (const credential of ["not-a-jwt", good.slice(0, -10) + "tamperedxx", await sign({ email_verified: false }), await sign({ azp: "evil-app" })]) {
      await expect(t.action(ref("authActions:googleLogin"), { credential })).rejects.toThrow();
    }
    const wrongAudience = await new SignJWT({ email: "new@gmail.com", email_verified: true })
      .setProtectedHeader({ alg: "RS256", kid: "test-key" }).setSubject("google-subject").setIssuedAt()
      .setExpirationTime("1h").setAudience("evil-app").setIssuer("https://accounts.google.com").sign(privateKey);
    const expired = await new SignJWT({ email: "new@gmail.com", email_verified: true })
      .setProtectedHeader({ alg: "RS256", kid: "test-key" }).setSubject("google-subject").setIssuedAt()
      .setExpirationTime(Math.floor(Date.now() / 1000) - 60).setAudience("test.apps.googleusercontent.com")
      .setIssuer("https://accounts.google.com").sign(privateKey);
    for (const credential of [wrongAudience, expired, await sign({ email: "test@gmail.com" }, "other-subject")]) {
      await expect(t.action(ref("authActions:googleLogin"), { credential })).rejects.toThrow();
    }
    const wrongIssuer = await new SignJWT({ email: "new@gmail.com", email_verified: true })
      .setProtectedHeader({ alg: "RS256", kid: "test-key" }).setSubject("google-subject").setIssuedAt()
      .setExpirationTime("1h").setAudience("test.apps.googleusercontent.com").setIssuer("https://evil.test").sign(privateKey);
    await expect(t.action(ref("authActions:googleLogin"), { credential: wrongIssuer })).rejects.toThrow();
    await t.run(async ctx => {
      await ctx.db.insert("users", { ...userData, email: "legacy@gmail.com", passwordHash: null, googleId: "legacy-subject", sessionToken: null });
    });
    await expect(t.action(ref("authActions:googleLogin"), {
      credential: await sign({ email: "legacy@gmail.com" }, "legacy-subject"),
    })).rejects.toThrow();
    vi.stubEnv("GOOGLE_CLIENT_ID", "");
    await expect(t.action(ref("authActions:googleLogin"), { credential: good })).rejects.toThrow();
    await expect(t.action(ref("authActions:googleLogin"), { email: "test@gmail.com", googleId: "forged", name: "Forged" })).rejects.toThrow();
    await expect(t.action(ref("authActions:register"), {
      ...registration, email: "injected@gmail.com", password: "long-password-123", googleId: "forged",
    })).rejects.toThrow();
  });
});
