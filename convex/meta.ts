import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// --- BRANDS ---
export const getBrands = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("brands").collect();
  },
});

export const addBrand = mutation({
  args: { name: v.string(), logo: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("brands")
      .filter((q) => q.eq(q.field("name"), args.name))
      .first();
    if (existing) throw new Error("Марката вече съществува!");
    return await ctx.db.insert("brands", args);
  },
});

export const removeBrand = mutation({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    const dbId = ctx.db.normalizeId("brands", args.id);
    if (!dbId) throw new Error("Invalid brand ID");
    await ctx.db.delete(dbId);
    return "Brand removed successfully";
  },
});

// --- MODELS ---
export const getModels = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("models").collect();
  },
});

export const addModel = mutation({
  args: { name: v.string(), brand: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("models")
      .filter((q) => q.and(q.eq(q.field("name"), args.name), q.eq(q.field("brand"), args.brand)))
      .first();
    if (existing) throw new Error("Моделът вече съществува за тази марка!");
    return await ctx.db.insert("models", args);
  },
});

export const removeModel = mutation({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    const dbId = ctx.db.normalizeId("models", args.id);
    if (!dbId) throw new Error("Invalid model ID");
    await ctx.db.delete(dbId);
    return "Model removed successfully";
  },
});

// --- CATEGORIES ---
export const getCategories = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("categories").collect();
  },
});

export const addCategory = mutation({
  args: { id: v.string(), name: v.string(), image: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("categories")
      .filter((q) => q.eq(q.field("id"), args.id))
      .first();
    if (existing) throw new Error("Категорията вече съществува!");
    return await ctx.db.insert("categories", args);
  },
});

export const removeCategory = mutation({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    const dbId = ctx.db.normalizeId("categories", args.id);
    if (!dbId) throw new Error("Invalid category ID");
    await ctx.db.delete(dbId);
    return "Category removed successfully";
  },
});

// --- SEED METADATA ---
export const seedMetadata = mutation({
  args: {},
  handler: async (ctx) => {
    // 1. Seed Categories
    const existingCats = await ctx.db.query("categories").collect();
    if (existingCats.length === 0) {
      const CATEGORIES = [
        { id: "cases", name: "Кейсове / Калъфи", image: "assets/cat_cases.png" },
        { id: "protectors", name: "Протектори за екран", image: "assets/cat_protectors.png" },
        { id: "car_acc", name: "Аксесоари за автомобил", image: "assets/cat_car_holder.png" },
        { id: "wireless_chargers", name: "Безжични зарядни", image: "assets/cat_wireless_charger.png" },
        { id: "all_chargers", name: "Зарядни устройства", image: "assets/cat_car_charger.png" },
        { id: "original_cables", name: "Кабели за зареждане", image: "assets/cat_cables.png" },
        { id: "desk_holder", name: "Поставки за бюро", image: "assets/cat_desk_stand.png" },
        { id: "selfie_stick", name: "Селфи стикове", image: "assets/cat_selfie_stick.png" },
        { id: "pop_socket", name: "Попсокет / Връзки", image: "assets/cat_pop_socket.png" },
        { id: "power_banks", name: "Външни батерии", image: "assets/cat_power_bank.png" }
      ];
      for (const cat of CATEGORIES) {
        await ctx.db.insert("categories", cat);
      }
    }

    // 2. Seed Brands with Logos
    const existingBrands = await ctx.db.query("brands").collect();
    if (existingBrands.length === 0) {
      const BRANDS = [
        { name: "Apple", logo: "logo_apple.png" },
        { name: "Samsung", logo: "logo_samsung.png" },
        { name: "Xiaomi", logo: "logo_xiaomi.png" },
        { name: "Huawei", logo: "logo_huawei.png" },
        { name: "Google", logo: "logo_google.png" },
        { name: "MOTO", logo: "logo_moto.png" },
        { name: "Honor", logo: "logo_honor.png" },
        { name: "Nokia", logo: "logo_nokia.png" },
        { name: "OnePlus", logo: "logo_oneplus.png" },
        { name: "Oppo", logo: "logo_oppo.png" },
        { name: "Vivo", logo: "logo_vivo.png" },
        { name: "TCL", logo: "logo_tcl.png" },
        { name: "Realme", logo: "logo_realme.png" },
        { name: "LG", logo: "logo_lg.png" },
        { name: "Lenovo", logo: "logo_lenovo.png" },
        { name: "Infinix", logo: "logo_infinix.png" }
      ];
      for (const brand of BRANDS) {
        await ctx.db.insert("brands", brand);
      }
    }

    // 3. Seed Models
    const existingModels = await ctx.db.query("models").collect();
    if (existingModels.length === 0) {
      const BRAND_MODELS: Record<string, string[]> = {
        "Apple": ["iPhone 15 Pro Max", "iPhone 15 Pro", "iPhone 15 Plus", "iPhone 15", "iPhone 14 Pro Max", "iPhone 14 Pro", "iPhone 14", "iPhone 13 Pro Max", "iPhone 13", "iPhone 12 Pro Max", "iPhone 12", "iPhone 11 Pro Max", "iPhone 11"],
        "Samsung": ["Galaxy S24 Ultra", "Galaxy S24+", "Galaxy S24", "Galaxy S23 Ultra", "Galaxy S23+", "Galaxy S23", "Galaxy S22 Ultra", "Galaxy S22", "Galaxy A55", "Galaxy A35", "Galaxy Z Fold 5", "Galaxy Z Flip 5"],
        "Xiaomi": ["Xiaomi 14 Ultra", "Xiaomi 13T Pro", "Redmi Note 13 Pro+", "Redmi Note 12 Pro"],
        "Huawei": ["Pura 70 Ultra", "Mate 60 Pro", "P60 Pro"],
        "Honor": ["Magic 6 Pro", "Honor 90"],
        "MOTO": ["Edge 50 Ultra", "Edge 40"],
        "Nokia": ["Nokia G42", "Nokia XR21"],
        "OnePlus": ["OnePlus 12", "OnePlus Nord 4"],
        "Oppo": ["Reno 12 Pro"],
        "Vivo": ["X100 Pro"],
        "Google": ["Pixel 8 Pro", "Pixel 8", "Pixel 7a"],
        "TCL": ["TCL 505"],
        "Realme": ["Realme GT 6"],
        "LG": ["Velvet"],
        "Lenovo": ["Legion Y90"],
        "Infinix": ["Note 40 Pro"]
      };
      for (const [brand, models] of Object.entries(BRAND_MODELS)) {
        for (const model of models) {
          await ctx.db.insert("models", { name: model, brand });
        }
      }
    }

    return "Metadata seeded successfully";
  },
});
