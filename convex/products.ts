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

export const deduplicate = mutation({
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
      .take(4000);
      
    const seen = new Map();
    let deletedCount = 0;
    
    for (const p of products) {
      const key = `${(p.name || "").toString().toLowerCase()}|${(p.brand || "").toString().toLowerCase()}|${(p.model || "").toString().toLowerCase()}|${p.priceB2C || 0}`;
      if (seen.has(key)) {
        const existing = seen.get(key);
        const existingHasLoader = (existing.image || "").includes("loader_1.png");
        const newHasLoader = (p.image || "").includes("loader_1.png");
        
        if (existingHasLoader && !newHasLoader) {
          // Delete existing (it has spinner), keep new (it has real image)
          await ctx.db.delete(existing._id);
          seen.set(key, p);
          deletedCount++;
        } else {
          // Delete new, keep existing
          await ctx.db.delete(p._id);
          deletedCount++;
        }
      } else {
        seen.set(key, p);
      }
    }
    
    return `Removed ${deletedCount} duplicate products.`;
  }
});

export const inspect = query({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db.query("products").collect();
    const keys = products.slice(0, 10).map(p => {
      return {
        id: p._id,
        name: p.name,
        brand: p.brand,
        model: p.model,
        priceB2C: p.priceB2C,
        price: p.price,
        isDeleted: p.isDeleted
      };
    });
    return {
      total: products.length,
      keys
    };
  }
});

export const upsertBatch = mutation({
  args: {
    products: v.array(
      v.object({
        id: v.union(v.string(), v.null()),
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
    let updatedCount = 0;
    let createdCount = 0;
    
    // Fetch all existing products once to avoid N table scans/queries inside the loop.
    const allExisting = await ctx.db.query("products").collect();
    
    // Create in-memory maps for fast lookup
    const byIdMap = new Map();
    const byNameKeyMap = new Map();
    
    for (const p of allExisting) {
      byIdMap.set(p._id, p);
      
      const key = `${p.name.trim().toLowerCase()}|${p.brand.trim().toLowerCase()}|${p.model.trim().toLowerCase()}|${p.category.trim().toLowerCase()}`;
      // If there are duplicates in the DB, prefer active ones
      if (!byNameKeyMap.has(key) || (!p.isDeleted && byNameKeyMap.get(key).isDeleted)) {
        byNameKeyMap.set(key, p);
      }
    }
    
    for (const p of args.products) {
      const { id, ...data } = p;
      let exists = false;
      
      if (id) {
        const dbId = ctx.db.normalizeId("products", id);
        if (dbId) {
          const existing = byIdMap.get(dbId);
          if (existing && !existing.isDeleted) {
            const patchedDoc = { ...existing, ...data };
            await ctx.db.patch(dbId, data);
            byIdMap.set(dbId, patchedDoc);
            
            const key = `${data.name.trim().toLowerCase()}|${data.brand.trim().toLowerCase()}|${data.model.trim().toLowerCase()}|${data.category.trim().toLowerCase()}`;
            byNameKeyMap.set(key, patchedDoc);
            
            updatedCount++;
            exists = true;
          }
        }
      }
      
      if (!exists) {
        // Fallback: look up by name, brand, model, category
        const key = `${data.name.trim().toLowerCase()}|${data.brand.trim().toLowerCase()}|${data.model.trim().toLowerCase()}|${data.category.trim().toLowerCase()}`;
        const existingByName = byNameKeyMap.get(key);
          
        if (existingByName) {
          const patchedDoc = { ...existingByName, ...data, isDeleted: false };
          await ctx.db.patch(existingByName._id, {
            ...data,
            isDeleted: false // Reactivate if it was soft-deleted
          });
          byIdMap.set(existingByName._id, patchedDoc);
          byNameKeyMap.set(key, patchedDoc);
          
          updatedCount++;
          exists = true;
        }
      }
      
      if (!exists) {
        const newId = await ctx.db.insert("products", data);
        createdCount++;
        
        const newDoc = { _id: newId, ...data } as any;
        byIdMap.set(newId, newDoc);
        
        const key = `${data.name.trim().toLowerCase()}|${data.brand.trim().toLowerCase()}|${data.model.trim().toLowerCase()}|${data.category.trim().toLowerCase()}`;
        byNameKeyMap.set(key, newDoc);
      }
    }
    
    return { updatedCount, createdCount };
  }
});

export const deleteDuplicateProducts = mutation({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db.query("products").collect();
    const activeProducts = products.filter(p => !p.isDeleted);
    
    const groups: Record<string, typeof activeProducts> = {};
    for (const p of activeProducts) {
      const key = `${p.name.trim().toLowerCase()}|${p.brand.trim().toLowerCase()}|${p.model.trim().toLowerCase()}|${p.category.trim().toLowerCase()}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(p);
    }
    
    let deletedCount = 0;
    for (const [key, list] of Object.entries(groups)) {
      if (list.length > 1) {
        // Keep the newest one by creation time, delete older ones
        list.sort((a, b) => b._creationTime - a._creationTime);
        const duplicates = list.slice(1);
        for (const dup of duplicates) {
          await ctx.db.delete(dup._id);
          deletedCount++;
        }
      }
    }
    return `Deleted ${deletedCount} duplicate products.`;
  }
});export const getSpigenS25 = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("products").collect();
    return all.filter(p => p.name.includes("S25") || p.name.includes("Spigen")).slice(0, 50).map(p => ({
      id: p._id,
      name: p.name,
      image: p.image,
      images: p.images
    }));
  }
});

export const deleteEnglishDuplicates = mutation({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db.query("products").collect();
    const cyrillic = products.filter(p => !p.isDeleted && /[а-яА-Я]/.test(p.name));
    const latin = products.filter(p => !p.isDeleted && !/[а-яА-Я]/.test(p.name));
    
    let deletedCount = 0;
    for (const l of latin) {
      const dup = cyrillic.find(c => c.brand === l.brand && c.model === l.model && c.priceB2C === l.priceB2C);
      if (dup) {
        await ctx.db.delete(l._id);
        deletedCount++;
      }
    }
    return `Deleted ${deletedCount} English duplicate products.`;
  }
});

export const getS26 = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("products").collect();
    return all.filter(p => p.model.toLowerCase().includes("s26") || p.name.toLowerCase().includes("s26")).map(p => ({
      id: p._id,
      name: p.name,
      brand: p.brand,
      model: p.model,
      category: p.category,
      priceB2C: p.priceB2C,
      isDeleted: p.isDeleted
    }));
  }
});

export const cleanupModelsAndProducts = mutation({
  args: {},
  handler: async (ctx) => {
    const suffixesToStrip = [
      "4в1 с джобче", "4 в 1 с джобче", "4в1", "4 в 1",
      "черен контур", "бял контур", "черен", "черна", "черно", "черни",
      "бял", "бяла", "бяло", "бели", "розов", "розова", "розово", "розови",
      "златен", "златна", "златно", "златни", "син", "синя", "синьо", "сини",
      "сив", "сива", "сиво", "сиви", "зелен", "зелена", "зелено", "зелени",
      "червен", "червена", "червено", "червени", "златист", "златиста", "златисто", "златисти",
      "лилав", "лилава", "лилаво", "лилави", "оранжев", "оранжева", "оранжево", "оранжеви",
      "сребрист", "сребриста", "сребристо", "сребристи", "прозрачен", "прозрачна", "прозрачно", "прозрачни"
    ];

    function cleanModelName(brand: string, name: string): string {
      if (!name) return "";
      let cleaned = name.trim();
      
      let changed = true;
      while (changed) {
        changed = false;
        const lower = cleaned.toLowerCase();
        for (const suffix of suffixesToStrip) {
          const regex = new RegExp(`[\\s-–—]+${suffix}$`, 'i');
          if (regex.test(cleaned)) {
            cleaned = cleaned.replace(regex, "").trim();
            changed = true;
            break;
          }
          
          if (lower.endsWith(" " + suffix) || lower.endsWith("-" + suffix)) {
            cleaned = cleaned.substring(0, cleaned.length - suffix.length).trim();
            changed = true;
            break;
          }
        }
      }
      
      cleaned = cleaned.replace(/[\s-–—]+$/, "").trim();
      
      if (brand && brand.toLowerCase() !== "всички марки") {
        const brandPrefixRegex = new RegExp(`^${brand}[\\s-]+`, 'i');
        if (brandPrefixRegex.test(cleaned)) {
          cleaned = cleaned.replace(brandPrefixRegex, "").trim();
        }
      }
      
      return cleaned;
    }

    // 1. Clean up product model fields
    const products = await ctx.db.query("products").collect();
    let productsUpdated = 0;
    for (const p of products) {
      const cleanModel = cleanModelName(p.brand, p.model);
      if (cleanModel && cleanModel !== p.model) {
        await ctx.db.patch(p._id, { model: cleanModel });
        productsUpdated++;
      }
    }

    // 2. Clean up models table
    const dbModels = await ctx.db.query("models").collect();
    const modelsKeep = new Map();
    let modelsDeleted = 0;
    let modelsUpdated = 0;

    for (const m of dbModels) {
      const cleanName = cleanModelName(m.brand, m.name);
      const key = `${m.brand.toLowerCase()}:${cleanName.toLowerCase()}`;
      
      if (!cleanName) {
        await ctx.db.delete(m._id);
        modelsDeleted++;
        continue;
      }

      if (modelsKeep.has(key)) {
        await ctx.db.delete(m._id);
        modelsDeleted++;
      } else {
        modelsKeep.set(key, m._id);
        if (cleanName !== m.name) {
          await ctx.db.patch(m._id, { name: cleanName });
          modelsUpdated++;
        }
      }
    }

    // 3. Clean up duplicate products by exact Name
    const refreshedProducts = await ctx.db.query("products").collect();
    const activeProducts = refreshedProducts.filter(p => !p.isDeleted);
    const groups: Record<string, typeof activeProducts> = {};
    
    for (const p of activeProducts) {
      const key = p.name.trim().toLowerCase();
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(p);
    }

    let productsDeleted = 0;
    for (const [key, list] of Object.entries(groups)) {
      if (list.length > 1) {
        // Keep the newest one, delete older ones
        list.sort((a, b) => b._creationTime - a._creationTime);
        const duplicates = list.slice(1);
        for (const dup of duplicates) {
          await ctx.db.delete(dup._id);
          productsDeleted++;
        }
      }
    }

    return {
      productsUpdated,
      modelsUpdated,
      modelsDeleted,
      productsDeleted
    };
  }
});
