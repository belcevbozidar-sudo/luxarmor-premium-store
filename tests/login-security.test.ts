import { afterEach, expect, test, vi } from "vitest";
import { convexTest } from "convex-test";
import { createHash } from "node:crypto";
import schema from "../convex/schema";
import { api, internal } from "../convex/_generated/api";

const modules = import.meta.glob("../convex/**/*.ts");
const email = "password@example.test";
const password = "legacy-password";
const sha = (s: string) => createHash("sha256").update(s).digest("hex");
async function fixture() {
  const t = convexTest(schema, modules);
  const userId = await t.run(ctx => ctx.db.insert("users", {
    email, passwordHash: sha(password), clientType: "B2C", name: "Test", phone: "123",
    address: "Test", googleId: null, sessionToken: null, createdAt: new Date().toISOString(),
  }));
  return { t, userId };
}
afterEach(() => { vi.useRealTimers(); vi.unstubAllEnvs(); vi.restoreAllMocks(); });

test("15 consecutive successful password logins never accumulate failures or lock out", async () => {
  const { t } = await fixture();
  for (let i = 0; i < 15; i++) {
    expect((await t.action(api.authActions.login, { email, password })).success).toBe(true);
  }
  expect(await t.run(ctx => ctx.db.query("loginFailures").take(2))).toEqual([]);
});

test("only failures count; ten failures rate-limit password verification with generic errors", async () => {
  const { t, userId } = await fixture();
  for (let i = 0; i < 10; i++) {
    await expect(t.action(api.authActions.login, { email, password: "wrong" })).rejects.toThrow("Невалиден имейл или парола.");
  }
  expect(await t.mutation(internal.users.checkLoginAttempt, { userId })).toBe(false);
  await expect(t.action(api.authActions.login, { email, password })).rejects.toThrow("Невалиден имейл или парола.");
  expect((await t.run(ctx => ctx.db.query("loginFailures").first()))!.failedCount).toBe(10);
});

test("successful login clears the relevant failures without clearing another user's state", async () => {
  const { t, userId } = await fixture();
  await t.mutation(internal.users.recordLoginFailure, { userId: null });
  for (let cycle = 0; cycle < 2; cycle++) {
    for (let i = 0; i < 9; i++) {
      await expect(t.action(api.authActions.login, { email, password: "wrong" })).rejects.toThrow();
    }
    expect((await t.action(api.authActions.login, { email, password })).success).toBe(true);
    expect(await t.mutation(internal.users.checkLoginAttempt, { userId })).toBe(true);
    const records = await t.run(ctx => ctx.db.query("loginFailures").take(5));
    expect(records).toHaveLength(1);
    expect(records[0].key).toBe("unknown");
  }
});

test("expired state resets safely and cleanup preserves new failures and admin sessions", async () => {
  const { t, userId } = await fixture();
  const now = Date.now();
  vi.spyOn(Date, "now").mockReturnValue(now);
  for (let i = 0; i < 10; i++) await t.mutation(internal.users.recordLoginFailure, { userId });
  vi.spyOn(Date, "now").mockReturnValue(now + 15 * 60 * 1000 + 1);
  expect(await t.mutation(internal.users.checkLoginAttempt, { userId })).toBe(true);
  await t.mutation(internal.users.recordLoginFailure, { userId });
  await t.run(async ctx => {
    await ctx.db.insert("loginFailures", { key: "expired", failedCount: 10, expiresAt: now });
    await ctx.db.insert("adminLocks", { fingerprint: "security:user:abandoned", failedCount: 10, lockedUntil: now });
    await ctx.db.insert("adminLocks", { fingerprint: "security:admin:v2", failedCount: 0, lockedUntil: 0,
      sessionHash: "keep-session", sessionExpiresAt: now + 8 * 60 * 60 * 1000 });
  });
  await t.mutation(internal.users.cleanLoginFailures, {});
  const state = await t.run(async ctx => ({ failures: await ctx.db.query("loginFailures").take(5), locks: await ctx.db.query("adminLocks").take(5) }));
  expect(state.failures).toHaveLength(1);
  expect(state.failures[0].key).toBe(userId);
  expect(state.failures[0].failedCount).toBe(1);
  expect(state.locks).toHaveLength(1);
  expect(state.locks[0].sessionHash).toBe("keep-session");
  vi.restoreAllMocks();
});

test("arbitrary email probes allocate at most one expiring unknown-account row", async () => {
  const { t } = await fixture();
  for (let i = 0; i < 40; i++) {
    await expect(t.action(api.authActions.login, { email: `probe${i}@example.test`, password: "wrong" })).rejects.toThrow("Невалиден имейл или парола.");
  }
  const records = await t.run(ctx => ctx.db.query("loginFailures").take(10));
  expect(records).toHaveLength(1);
  expect(records[0].key).toBe("unknown");
  expect(records[0].failedCount).toBe(10);
  expect(records[0].expiresAt).toBeLessThanOrEqual(Date.now() + 15 * 60 * 1000);
});

test("Google legacy upgrade requires normalized matching email, null password and matching sub", async () => {
  const { t, userId } = await fixture();
  await t.run(ctx => ctx.db.patch(userId, { email: " Legacy@Gmail.com ", passwordHash: null, googleId: "legacy-sub" }));
  // This internal entry point is only reachable after JWT verification in authActions.
  const args = { email: "legacy@gmail.com", name: "Google", googleId: "legacy-sub", sessionHash: sha("new-session") };
  await expect(t.mutation(internal.users.googleLogin, { ...args, email: "different@gmail.com" })).rejects.toThrow();
  const result = await t.mutation(internal.users.googleLogin, args);
  expect(result.userId).toBe(userId);
  expect((await t.run(ctx => ctx.db.get(userId)))!.googleVerified).toBe(true);
  expect(await t.run(ctx => ctx.db.query("users").take(5))).toHaveLength(1);
});
