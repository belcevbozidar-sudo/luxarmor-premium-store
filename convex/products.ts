import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const get = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("products").collect();
  },
});

export const seed = mutation({
  args: {
    products: v.array(
      v.object({
        name: v.string(),
        brand: v.string(),
        model: v.string(),
        category: v.string(),
        price: v.number(),
        oldPrice: v.union(v.number(), v.null()),
        image: v.string(),
        rating: v.number(),
        tag: v.union(v.string(), v.null()),
        description: v.string(),
        specs: v.object({
          material: v.string(),
          weight: v.string(),
          origin: v.string(),
          delivery: v.string(),
        }),
      })
    ),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("products").collect();
    if (existing.length > 0) {
      return "Already seeded";
    }
    for (const p of args.products) {
      await ctx.db.insert("products", p);
    }
    return "Seeded successfully";
  },
});
