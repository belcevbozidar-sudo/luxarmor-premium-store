import { afterEach, expect, test, vi } from "vitest";
import { convexTest } from "convex-test";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import schema from "../convex/schema";
import { api } from "../convex/_generated/api";
import { ADMIN_LOCK_KEY, ADMIN_TTL } from "../convex/security";

const modules = import.meta.glob("../convex/**/*.ts");
const syncSecret = "fixture-only-sync-secret-with-at-least-32-characters";
const adminPassword = "fixture-only-admin-password-at-least-32-characters";
const adminToken = "ck2_admin_" + "a".repeat(64);
const sha = (value: string) => createHash("sha256").update(value).digest("hex");
afterEach(() => vi.unstubAllEnvs());

test("every sync operation requires a dedicated secret or a valid admin token", async () => {
  const t = convexTest(schema, modules);
  vi.stubEnv("CASEKING_SYNC_SECRET", syncSecret);
  vi.stubEnv("ADMIN_PASSWORD", adminPassword);
  const operations = [
    ["products", "backfillMatchKeys", { cursor: null }],
    ["products", "upsertBatch", { products: [] }],
    ["meta", "addBrand", { name: "Test", logo: "test.webp", source: "koff-sync" }],
    ["meta", "addModel", { name: "Test", brand: "Test", source: "koff-sync" }],
    ["meta", "countProductsByCategory", { cursor: null, countsSoFar: {} }],
  ] as const;
  for (const [file, name, args] of operations) {
    const mod = await modules[`../convex/${file}.ts`]() as Record<string, { _handler: Function }>;
    for (const credentials of [{}, { syncSecret: "wrong" }, { syncSecret: adminPassword }, { syncSecret: adminToken }]) {
      await t.run(async ctx => {
        await expect(mod[name]._handler(ctx, { ...args, ...credentials })).rejects.toThrow("Unauthorized");
      });
    }
  }
  const brandId = await t.mutation(api.meta.addBrand, { name: "Test", logo: "test.webp", syncSecret });
  const modelId = await t.mutation(api.meta.addModel, { name: "Test", brand: "Test", syncSecret });
  expect(await t.mutation(api.products.backfillMatchKeys, { cursor: null, syncSecret })).toMatchObject({ updated: 0, isDone: true });
  expect(await t.mutation(api.meta.countProductsByCategory, { cursor: null, countsSoFar: {}, syncSecret })).toMatchObject({ isDone: true });
  expect(await t.mutation(api.products.upsertBatch, { products: [], syncSecret })).toEqual({ updatedCount: 0, createdCount: 0 });
  await t.run(async ctx => {
    expect(await ctx.db.get(brandId)).not.toHaveProperty("syncSecret");
    expect(await ctx.db.get(modelId)).not.toHaveProperty("syncSecret");
    await ctx.db.insert("adminLocks", { fingerprint: ADMIN_LOCK_KEY, failedCount: 0, lockedUntil: 0,
      sessionHash: sha(adminToken), sessionExpiresAt: Date.now() + ADMIN_TTL, passwordVersion: sha(adminPassword) });
  });
  await expect(t.mutation(api.products.upsertBatch, { products: [], adminToken })).resolves.toBeDefined();
});

test("sync secret has no authority over other admin operations", async () => {
  const t = convexTest(schema, modules);
  vi.stubEnv("CASEKING_SYNC_SECRET", syncSecret);
  vi.stubEnv("ADMIN_PASSWORD", adminPassword);
  await expect(t.mutation(api.settings.updateHero, { heroTitle: "No", heroSubtitle: "No", adminToken: syncSecret })).rejects.toThrow();
  for (const [file, allowed] of [["products", ["backfillMatchKeys", "upsertBatch"]], ["meta", ["addBrand", "addModel", "countProductsByCategory"]]] as const) {
    const source = readFileSync(new URL(`../convex/${file}.ts`, import.meta.url), "utf8");
    const names = [...source.matchAll(/export const (\w+) = adminOrSyncMutation\(/g)].map(m => m[1]);
    expect(names.sort()).toEqual([...allowed].sort());
    // Static check only: never invoke the destructive operation.
    expect(names).not.toContain("deleteAllProductsPaginated");
  }
  for (const file of ["app.js", "admin.js", "blog.js", "index.html", "admin.html", "blog.html"]) {
    const source = readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
    expect(source).not.toContain("CASEKING_SYNC_SECRET");
    expect(source).not.toContain(syncSecret);
  }
});

test("missing, weak, reused password or session-shaped sync secret fails closed", async () => {
  const t = convexTest(schema, modules);
  vi.stubEnv("ADMIN_PASSWORD", adminPassword);
  for (const value of ["", "weak", adminPassword, adminToken]) {
    vi.stubEnv("CASEKING_SYNC_SECRET", value);
    await expect(t.mutation(api.products.upsertBatch, { products: [], syncSecret: value })).rejects.toThrow("Unauthorized");
  }
});
