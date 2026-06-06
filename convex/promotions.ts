import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getActive = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("promotions")
      .filter((q) => q.eq(q.field("active"), true))
      .collect();
  },
});

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("promotions").collect();
  },
});

export const create = mutation({
  args: {
    clientType: v.string(), // "B2C" | "B2B"
    type: v.string(), // "gift" | "free_shipping"
    threshold: v.number(),
    giftProductId: v.union(v.string(), v.null()),
    active: v.boolean(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("promotions", args);
  },
});

export const update = mutation({
  args: {
    id: v.string(),
    clientType: v.string(),
    type: v.string(),
    threshold: v.number(),
    giftProductId: v.union(v.string(), v.null()),
    active: v.boolean(),
  },
  handler: async (ctx, args) => {
    const { id, ...data } = args;
    const dbId = ctx.db.normalizeId("promotions", id);
    if (!dbId) throw new Error("Invalid promotion ID");
    await ctx.db.patch(dbId, data);
    return "Promotion updated successfully";
  },
});

export const remove = mutation({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    const dbId = ctx.db.normalizeId("promotions", args.id);
    if (!dbId) throw new Error("Invalid promotion ID");
    await ctx.db.delete(dbId);
    return "Promotion removed successfully";
  },
});

export const seedDefaults = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("promotions").collect();
    if (existing.length > 0) return "Already seeded promotions";

    // Find a product to use as default B2C gift (Power bank)
    const powerBank = await ctx.db
      .query("products")
      .filter((q) => q.eq(q.field("category"), "power_banks"))
      .first();
    const b2cGiftId = powerBank ? powerBank._id.toString() : null;

    // Find a product to use as default B2B gift (Wireless Charger Station)
    const charger = await ctx.db
      .query("products")
      .filter((q) => q.eq(q.field("category"), "wireless_chargers"))
      .first();
    const b2bGiftId = charger ? charger._id.toString() : null;

    // Seed B2C Promotions
    await ctx.db.insert("promotions", {
      clientType: "B2C",
      type: "free_shipping",
      threshold: 50.0,
      giftProductId: null,
      active: true,
    });
    await ctx.db.insert("promotions", {
      clientType: "B2C",
      type: "gift",
      threshold: 100.0,
      giftProductId: b2cGiftId,
      active: true,
    });

    // Seed B2B Promotions
    await ctx.db.insert("promotions", {
      clientType: "B2B",
      type: "free_shipping",
      threshold: 150.0,
      giftProductId: null,
      active: true,
    });
    await ctx.db.insert("promotions", {
      clientType: "B2B",
      type: "gift",
      threshold: 300.0,
      giftProductId: b2bGiftId,
      active: true,
    });

    return "Promotions seeded successfully";
  },
});
