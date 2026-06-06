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
        id: v.number(),
        name: v.string(),
        price: v.number(),
        quantity: v.number(),
      })
    ),
    total: v.number(),
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
    });
  },
});

export const get = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("orders").order("desc").collect();
  },
});
