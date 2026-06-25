import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  products: defineTable({
    name: v.string(),
    brand: v.string(),
    model: v.string(),
    category: v.string(),
    image: v.string(),
    images: v.optional(v.array(v.string())), // multiple images array
    rating: v.number(),
    tag: v.union(v.string(), v.null()),
    description: v.string(),
    specs: v.object({
      material: v.string(),
      weight: v.string(),
      origin: v.string(),
      delivery: v.string(),
    }),
    // Kept for legacy compatibility and seeding
    price: v.optional(v.number()),
    oldPrice: v.optional(v.union(v.number(), v.null())),
    
    // New B2C and B2B pricing
    priceB2C: v.optional(v.number()),
    oldPriceB2C: v.optional(v.union(v.number(), v.null())),
    priceB2B: v.optional(v.number()),
    oldPriceB2B: v.optional(v.union(v.number(), v.null())),
    isDeleted: v.optional(v.boolean()),
  }),

  orders: defineTable({
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
    status: v.string(),
    createdAt: v.string(),
    clientType: v.string(), // "B2C" | "B2B"
    companyName: v.optional(v.string()),
    companyBulstat: v.optional(v.string()),
    promoCode: v.optional(v.string()),
    discountAmount: v.optional(v.number()),
  }),

  adminLocks: defineTable({
    fingerprint: v.string(),
    failedCount: v.number(),
    lockedUntil: v.number(), // timestamp in ms
  }).index("by_fingerprint", ["fingerprint"]),

  promotions: defineTable({
    clientType: v.string(), // "B2C" | "B2B"
    type: v.string(), // "gift" | "free_shipping"
    threshold: v.number(), // min spend
    giftProductId: v.union(v.string(), v.null()), // product id or null
    active: v.boolean(),
  }),

  users: defineTable({
    email: v.string(),
    passwordHash: v.union(v.string(), v.null()),
    clientType: v.string(), // "B2C" | "B2B"
    name: v.string(),
    phone: v.string(),
    address: v.string(),
    googleId: v.union(v.string(), v.null()),
    companyDetails: v.optional(
      v.object({
        name: v.string(),
        bulstat: v.string(),
        address: v.string(),
        mol: v.string(),
        vatRegistered: v.boolean(),
      })
    ),
    sessionToken: v.union(v.string(), v.null()),
    createdAt: v.string(),
  })
    .index("by_email", ["email"])
    .index("by_session", ["sessionToken"]),

  brands: defineTable({
    name: v.string(),
    logo: v.string(),
  }),

  models: defineTable({
    name: v.string(),
    brand: v.string(),
  }),

  categories: defineTable({
    id: v.string(),
    name: v.string(),
    image: v.string(),
    description: v.optional(v.string()),
    seoTitle: v.optional(v.string()),
    seoDescription: v.optional(v.string()),
  }),

  promoCodes: defineTable({
    code: v.string(),
    discountType: v.string(), // "percent" | "fixed"
    discountValue: v.number(),
    active: v.boolean(),
  }).index("by_code", ["code"]),

  blogPosts: defineTable({
    title: v.string(),
    slug: v.string(),
    summary: v.string(),
    content: v.string(),
    coverImage: v.string(),
    readTime: v.number(),
    category: v.string(),
    author: v.optional(v.string()),
    createdAt: v.string(),
    relatedProducts: v.optional(v.array(v.string())),
    isPublished: v.boolean(),
  }).index("by_slug", ["slug"])
    .index("by_published", ["isPublished"]),

  homepageSettings: defineTable({
    heroTitle: v.string(),
    heroSubtitle: v.string(),
  }),

  contactMessages: defineTable({
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    message: v.string(),
    createdAt: v.string(),
    status: v.string(),
  }),

  pageMetadata: defineTable({
    pageKey: v.string(), // "home" | "za-nas" | "kontakti" | "aksesoari"
    title: v.string(),
    description: v.string(),
  }).index("by_pageKey", ["pageKey"]),
});

