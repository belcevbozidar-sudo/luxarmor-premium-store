import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { adminMutation, adminQuery } from "./security";
import schema from "./schema";

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
        image: v.optional(v.string()),
        productUrl: v.optional(v.string()),
        productSlug: v.optional(v.string()),
      })
    ),
    subtotal: v.optional(v.number()),
    shippingCost: v.optional(v.number()),
    totalWithoutVat: v.optional(v.number()),
    vatAmount: v.optional(v.number()),
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
      subtotal: args.subtotal,
      shippingCost: args.shippingCost,
      totalWithoutVat: args.totalWithoutVat,
      vatAmount: args.vatAmount,
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

export const get = adminQuery({
  args: { cursor: v.optional(v.union(v.string(), v.null())) },
  returns: v.object({
    page: v.array(v.object({ ...schema.tables.orders.validator.fields, _id: v.id("orders"), _creationTime: v.number() })),
    isDone: v.boolean(), continueCursor: v.string(),
  }),
  handler: async (ctx, args) => {
    const result = await ctx.db.query("orders").order("desc").paginate({ cursor: args.cursor ?? null, numItems: 100 });
    return { page: result.page, isDone: result.isDone, continueCursor: result.continueCursor };
  },
});

export const updateStatus = adminMutation({
  args: {
    id: v.id("orders"),
    status: v.union(v.literal("pending"), v.literal("completed"), v.literal("cancelled")),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    const dbId = ctx.db.normalizeId("orders", args.id);
    if (!dbId) throw new Error("Invalid order ID");
    await ctx.db.patch(dbId, { status: args.status });
    return "Order status updated successfully";
  },
});
