import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// --- GET ALL PROMO CODES ---
export const get = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("promoCodes").collect();
  },
});

// --- CREATE PROMO CODE ---
export const create = mutation({
  args: {
    code: v.string(),
    discountType: v.string(), // "percent" | "fixed"
    discountValue: v.number(),
  },
  handler: async (ctx, args) => {
    const codeUpper = args.code.trim().toUpperCase();
    
    // Check for duplicate
    const existing = await ctx.db
      .query("promoCodes")
      .withIndex("by_code", (q) => q.eq("code", codeUpper))
      .first();
      
    if (existing) {
      throw new Error("Промо кодът вече съществува!");
    }
    
    return await ctx.db.insert("promoCodes", {
      code: codeUpper,
      discountType: args.discountType,
      discountValue: args.discountValue,
      active: true,
    });
  },
});

// --- REMOVE PROMO CODE ---
export const remove = mutation({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    const dbId = ctx.db.normalizeId("promoCodes", args.id);
    if (!dbId) throw new Error("Невалиден ID на промо код");
    await ctx.db.delete(dbId);
    return "Promo code removed successfully";
  },
});

// --- VERIFY CODE ---
export const verifyCode = query({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const codeUpper = args.code.trim().toUpperCase();
    const promo = await ctx.db
      .query("promoCodes")
      .withIndex("by_code", (q) => q.eq("code", codeUpper))
      .first();
      
    if (!promo || !promo.active) {
      return { success: false, error: "Невалиден или неактивен промо код!" };
    }
    
    return {
      success: true,
      code: promo.code,
      discountType: promo.discountType,
      discountValue: promo.discountValue,
    };
  },
});
