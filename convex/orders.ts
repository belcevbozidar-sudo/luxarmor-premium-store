import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    orderNumber: v.string(),
    name: v.string(),
    phone: v.string(),
    address: v.string(),
    items: v.array(
      v.object({
        id: v.string(),
        name: v.string(),
        price: v.number(),
        quantity: v.number(),
        isGift: v.optional(v.boolean()),
      })
    ),
    total: v.number(),
    clientType: v.string(), // "B2C" | "B2B"
    companyName: v.optional(v.string()),
    companyBulstat: v.optional(v.string()),
    promoCode: v.optional(v.string()),
    discountAmount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("orders", {
      orderNumber: args.orderNumber,
      name: args.name,
      phone: args.phone,
      address: args.address,
      items: args.items,
      total: args.total,
      status: "pending",
      createdAt: new Date().toISOString(),
      clientType: args.clientType,
      companyName: args.companyName,
      companyBulstat: args.companyBulstat,
      promoCode: args.promoCode,
      discountAmount: args.discountAmount,
    });
  },
});

export const get = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("orders").order("desc").collect();
  },
});

export const updateStatus = mutation({
  args: {
    id: v.string(),
    status: v.string(), // "pending" | "completed" | "cancelled"
  },
  handler: async (ctx, args) => {
    const dbId = ctx.db.normalizeId("orders", args.id);
    if (!dbId) throw new Error("Invalid order ID");
    await ctx.db.patch(dbId, { status: args.status });
    return "Order status updated successfully";
  },
});
