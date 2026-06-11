import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const get = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("products")
      .filter((q) =>
        q.or(
          q.eq(q.field("isDeleted"), undefined),
          q.eq(q.field("isDeleted"), false)
        )
      )
      .collect();
  },
});

export const getById = query({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    try {
      const dbId = ctx.db.normalizeId("products", args.id);
      if (!dbId) return null;
      const product = await ctx.db.get(dbId);
      if (!product || product.isDeleted) return null;
      return product;
    } catch {
      return null;
    }
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    brand: v.string(),
    model: v.string(),
    category: v.string(),
    image: v.string(),
    images: v.optional(v.array(v.string())), // multiple images support
    rating: v.number(),
    tag: v.union(v.string(), v.null()),
    description: v.string(),
    specs: v.object({
      material: v.string(),
      weight: v.string(),
      origin: v.string(),
      delivery: v.string(),
    }),
    priceB2C: v.number(),
    oldPriceB2C: v.union(v.number(), v.null()),
    priceB2B: v.number(),
    oldPriceB2B: v.union(v.number(), v.null()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("products", args);
  },
});

export const update = mutation({
  args: {
    id: v.string(),
    name: v.string(),
    brand: v.string(),
    model: v.string(),
    category: v.string(),
    image: v.string(),
    images: v.optional(v.array(v.string())), // multiple images support
    rating: v.number(),
    tag: v.union(v.string(), v.null()),
    description: v.string(),
    specs: v.object({
      material: v.string(),
      weight: v.string(),
      origin: v.string(),
      delivery: v.string(),
    }),
    priceB2C: v.number(),
    oldPriceB2C: v.union(v.number(), v.null()),
    priceB2B: v.number(),
    oldPriceB2B: v.union(v.number(), v.null()),
  },
  handler: async (ctx, args) => {
    const { id, ...data } = args;
    const dbId = ctx.db.normalizeId("products", id);
    if (!dbId) throw new Error("Invalid product ID");
    await ctx.db.patch(dbId, data);
    return "Product updated successfully";
  },
});

export const remove = mutation({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    const dbId = ctx.db.normalizeId("products", args.id);
    if (!dbId) throw new Error("Invalid product ID");
    await ctx.db.patch(dbId, { isDeleted: true });
    return "Product removed successfully";
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
      for (const p of existing) {
        const anyP = p as any;
        const patchData: any = {};
        
        if (anyP.priceB2C === undefined) {
          const pB2C = anyP.price || 29.00;
          const oldPB2C = anyP.oldPrice || null;
          patchData.priceB2C = pB2C;
          patchData.oldPriceB2C = oldPB2C;
          patchData.priceB2B = Math.round(pB2C * 0.8 * 100) / 100;
          patchData.oldPriceB2B = oldPB2C ? Math.round(oldPB2C * 0.8 * 100) / 100 : null;
        }
        
        if (anyP.images === undefined) {
          patchData.images = [anyP.image];
        }
        
        if (Object.keys(patchData).length > 0) {
          await ctx.db.patch(p._id, patchData);
        }
      }
      return "Already seeded/migrated";
    }
    
    for (const p of args.products) {
      const pB2C = p.price;
      const oldPB2C = p.oldPrice;
      const pB2B = Math.round(pB2C * 0.8 * 100) / 100;
      const oldPB2B = oldPB2C ? Math.round(oldPB2C * 0.8 * 100) / 100 : null;

      await ctx.db.insert("products", {
        name: p.name,
        brand: p.brand,
        model: p.model,
        category: p.category,
        image: p.image,
        images: [p.image], // initialize images array
        rating: p.rating,
        tag: p.tag,
        description: p.description,
        specs: p.specs,
        priceB2C: pB2C,
        oldPriceB2C: oldPB2C,
        priceB2B: pB2B,
        oldPriceB2B: oldPB2B,
      });
    }
    return "Seeded successfully";
  },
});

export const clearAll = mutation({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db
      .query("products")
      .filter((q) =>
        q.or(
          q.eq(q.field("isDeleted"), undefined),
          q.eq(q.field("isDeleted"), false)
        )
      )
      .collect();
    for (const p of products) {
      await ctx.db.patch(p._id, { isDeleted: true });
    }
    return `Deleted ${products.length} products`;
  },
});

export const createBatch = mutation({
  args: {
    products: v.array(
      v.object({
        name: v.string(),
        brand: v.string(),
        model: v.string(),
        category: v.string(),
        image: v.string(),
        images: v.optional(v.array(v.string())),
        rating: v.number(),
        tag: v.union(v.string(), v.null()),
        description: v.string(),
        specs: v.object({
          material: v.string(),
          weight: v.string(),
          origin: v.string(),
          delivery: v.string(),
        }),
        priceB2C: v.number(),
        oldPriceB2C: v.union(v.number(), v.null()),
        priceB2B: v.number(),
        oldPriceB2B: v.union(v.number(), v.null()),
      })
    ),
  },
  handler: async (ctx, args) => {
    let count = 0;
    for (const p of args.products) {
      await ctx.db.insert("products", p);
      count++;
    }
    return count;
  },
});

export const migrateSemicolonImages = mutation({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db.query("products").collect();
    let updatedCount = 0;
    
    for (const p of products) {
      const anyP = p as any;
      let needsPatch = false;
      const patchData: any = {};
      
      // Check if p.image has semicolons
      if (anyP.image && anyP.image.includes(";")) {
        const parts = anyP.image.split(";").map((img: string) => img.trim()).filter(Boolean);
        if (parts.length > 0) {
          patchData.image = parts[0];
          needsPatch = true;
        }
      }
      
      // Check if p.images array contains elements with semicolons
      if (anyP.images && anyP.images.length > 0) {
        let newImages: string[] = [];
        let hasSemicolons = false;
        
        for (const img of anyP.images) {
          if (img.includes(";")) {
            hasSemicolons = true;
            const parts = img.split(";").map((i: string) => i.trim()).filter(Boolean);
            newImages = [...newImages, ...parts];
          } else {
            newImages.push(img);
          }
        }
        
        if (hasSemicolons) {
          patchData.images = newImages;
          needsPatch = true;
        }
      }
      
      if (needsPatch) {
        await ctx.db.patch(p._id, patchData);
        updatedCount++;
      }
    }
    
    return `Cleaned up semicolon-separated images in ${updatedCount} products`;
  },
});

