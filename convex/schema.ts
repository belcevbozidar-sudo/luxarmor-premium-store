import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  products: defineTable({
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
  }),
  orders: defineTable({
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
    status: v.string(),
    createdAt: v.string(),
  }),
});
