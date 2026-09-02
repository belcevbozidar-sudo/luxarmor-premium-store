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
    if (existing) return existing._id;
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
    if (existing) return existing._id;
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
  args: {
    id: v.string(),
    name: v.string(),
    image: v.string(),
    description: v.optional(v.string()),
    seoTitle: v.optional(v.string()),
    seoDescription: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("categories")
      .filter((q) => q.eq(q.field("id"), args.id))
      .first();
    if (existing) return existing._id;
    return await ctx.db.insert("categories", {
      id: args.id,
      name: args.name,
      image: args.image,
      description: args.description || "",
      seoTitle: args.seoTitle || "",
      seoDescription: args.seoDescription || "",
    });
  },
});

export const updateCategory = mutation({
  args: {
    id: v.string(),
    name: v.string(),
    image: v.optional(v.string()),
    description: v.optional(v.string()),
    seoTitle: v.optional(v.string()),
    seoDescription: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("categories")
      .filter((q) => q.eq(q.field("id"), args.id))
      .first();
    if (!existing) throw new Error("Category not found");
    
    const patchData: any = {
      name: args.name,
      description: args.description || "",
      seoTitle: args.seoTitle || "",
      seoDescription: args.seoDescription || "",
    };
    if (args.image) {
      patchData.image = args.image;
    }
    
    await ctx.db.patch(existing._id, patchData);
    return existing._id;
  },
});

// Преброява активните продукти по категория и записва резултата в
// categories.productCount, за да не се налага страницата "Категории" да
// сваля целия каталог само за да покаже брой продукти на всяка плочка.
// Странирано (като backfillMatchKeys) - вика се на цикъл от скрипт с
// countsSoFar от предишния отговор, докато isDone стане true; на
// последната страница записва финалните числа в categories.
export const countProductsByCategory = mutation({
  args: {
    cursor: v.union(v.string(), v.null()),
    countsSoFar: v.record(v.string(), v.number()),
  },
  handler: async (ctx, args) => {
    const result = await ctx.db.query("products").paginate({
      cursor: args.cursor ?? null,
      numItems: 500,
    });

    const counts: Record<string, number> = { ...args.countsSoFar };
    for (const doc of result.page) {
      if (doc.isDeleted) continue;
      counts[doc.category] = (counts[doc.category] || 0) + 1;
    }

    if (result.isDone) {
      const categories = await ctx.db.query("categories").collect();
      for (const cat of categories) {
        await ctx.db.patch(cat._id, { productCount: counts[cat.id] || 0 });
      }
    }

    return { counts, isDone: result.isDone, continueCursor: result.continueCursor };
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
        { id: "keysove-i-kalufi", name: "Кейсове / Калъфи", image: "assets/cat_cases.webp", description: "Открийте нашата богата гама от висококачествени кейсове и калъфи, осигуряващи максимална защита и неповторим стил за вашия телефон." },
        { id: "protektori-za-ekran", name: "Протектори за екран", image: "assets/cat_protectors.webp", description: "Изключително здрави закалени стъклени протектори за екран, предпазващи дисплея от надраскване, пукнатини и силни удари без загуба на чувствителност." },
        { id: "aksesoari-za-avtomobili", name: "Аксесоари за автомобил", image: "assets/cat_car_holder.webp", description: "Удобни магнитни и механични поставки, безжични зарядни и други важни аксесоари за безопасно и комфортно пътуване във вашия автомобил." },
        { id: "bezzhichni-zaryadni", name: "Безжични зарядни", image: "assets/cat_wireless_charger.webp", description: "Модерни и бързи безжични зарядни устройства, съвместими с MagSafe и Qi стандарти за максимално улеснение в ежедневието ви." },
        { id: "zaryadni-ustroystva", name: "Зарядни устройства", image: "assets/cat_car_charger.webp", description: "Висококачествени адаптери за стена и кола с технологии за бързо зареждане Power Delivery и Quick Charge за всички ваши устройства." },
        { id: "kabeli-za-zaryadane", name: "Кабели за зареждане", image: "assets/cat_cables.webp", description: "Издръжливи кабелни решения с текстилна оплетка и подсилени краища за бърз трансфер на данни и сигурно захранване без прекъсване." },
        { id: "postavki-za-byuro", name: "Поставки за бюро", image: "assets/cat_desk_stand.webp", description: "Ергономични метални и пластмасови поставки за бюро, подходящи за видео разговори, гледане на съдържание и удобна ежедневна работа." },
        { id: "selfi-stikove", name: "Селфи стикове", image: "assets/cat_selfie_stick.webp", description: "Стабилни и леки селфи стикове с вграден трипод и Bluetooth дистанционно управление за заснемане на перфектните моменти навсякъде." },
        { id: "popsoket-i-vrazki", name: "Попсокет / Връзки", image: "assets/cat_pop_socket.webp", description: "Практични попсокети, пръстени и стилни връзки за ръка за по-сигурен захват и уникална персонализация на вашия смартфон." },
        { id: "vanshni-baterii", name: "Външни батерии", image: "assets/cat_power_bank.webp", description: "Мощни преносими батерии с голям капацитет и бързо безжично или жично зареждане, за да бъдете винаги свързани в движение." }
      ];
      for (const cat of CATEGORIES) {
        await ctx.db.insert("categories", cat);
      }
    }

    // 2. Seed Brands with Logos
    const existingBrands = await ctx.db.query("brands").collect();
    if (existingBrands.length === 0) {
      const BRANDS = [
        { name: "Apple", logo: "logo_apple.webp" },
        { name: "Samsung", logo: "logo_samsung.webp" },
        { name: "Xiaomi", logo: "logo_xiaomi.webp" },
        { name: "Huawei", logo: "logo_huawei.webp" },
        { name: "Google", logo: "logo_google.webp" },
        { name: "MOTO", logo: "logo_moto.webp" },
        { name: "Honor", logo: "logo_honor.webp" },
        { name: "Nokia", logo: "logo_nokia.webp" },
        { name: "OnePlus", logo: "logo_oneplus.webp" },
        { name: "Oppo", logo: "logo_oppo.webp" },
        { name: "Vivo", logo: "logo_vivo.webp" },
        { name: "TCL", logo: "logo_tcl.webp" },
        { name: "Realme", logo: "logo_realme.webp" },
        { name: "LG", logo: "logo_lg.webp" },
        { name: "Lenovo", logo: "logo_lenovo.webp" },
        { name: "Infinix", logo: "logo_infinix.webp" }
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

    // 4. Seed Page Metadata (SEO settings)
    const existingSeo = await ctx.db.query("pageMetadata").collect();
    if (existingSeo.length === 0) {
      const SEO_DEFAULTS = [
        {
          pageKey: "home",
          title: "CaseKing - Избери Марка и Модел за Телефон | Кейсове и Аксесоари",
          description: "Добре дошли в CaseKing - най-големият избор на премиум кейсове, протектори и аксесоари за мобилни телефони. Изберете марка, модел и поръчайте с доставка за 3-4 работни дни и преглед (без тест)!"
        },
        {
          pageKey: "za-nas",
          title: "За нас | CaseKing",
          description: "Научете повече за CaseKing, нашата визия и мисията ни да осигурим безкомпромисно качество и доставка за 3-4 работни дни на премиум телефонни аксесоари."
        },
        {
          pageKey: "kontakti",
          title: "Контакти | CaseKing",
          description: "Свържете се с CaseKing. Изпратете ни запитване през нашата контактна форма или се обадете на 0878 202 823 за консултация."
        },
        {
          pageKey: "aksesoari",
          title: "Категории Аксесоари | CaseKing",
          description: "Разгледайте нашите категории аксесоари за мобилни телефони - кейсове, калъфи, стъклени протектори, зарядни устройства и много други."
        }
      ];
      for (const seo of SEO_DEFAULTS) {
        await ctx.db.insert("pageMetadata", seo);
      }
    }

    return "Metadata seeded successfully";
  },
});

export const migrateToWebp = mutation({
  args: {},
  handler: async (ctx) => {
    // 1. Migrate Categories
    const categories = await ctx.db.query("categories").collect();
    let catCount = 0;
    for (const cat of categories) {
      if (cat.image.endsWith(".png")) {
        const newImage = cat.image.substring(0, cat.image.length - 4) + ".webp";
        await ctx.db.patch(cat._id, { image: newImage });
        catCount++;
      }
    }

    // 2. Migrate Brands
    const brands = await ctx.db.query("brands").collect();
    let brandCount = 0;
    for (const brand of brands) {
      if (brand.logo.endsWith(".png")) {
        const newLogo = brand.logo.substring(0, brand.logo.length - 4) + ".webp";
        await ctx.db.patch(brand._id, { logo: newLogo });
        brandCount++;
      }
    }

    return { categoriesUpdated: catCount, brandsUpdated: brandCount };
  },
});

export const migrateCategories = mutation({
  args: {},
  handler: async (ctx) => {
    const mapping: Record<string, string> = {
      "cases": "keysove-i-kalufi",
      "protectors": "protektori-za-ekran",
      "car_acc": "aksesoari-za-avtomobili",
      "wireless_chargers": "bezzhichni-zaryadni",
      "all_chargers": "zaryadni-ustroystva",
      "original_cables": "kabeli-za-zaryadane",
      "desk_holder": "postavki-za-byuro",
      "selfie_stick": "selfi-stikove",
      "pop_socket": "popsoket-i-vrazki",
      "power_banks": "vanshni-baterii"
    };

    // 1. Migrate categories table IDs
    const categories = await ctx.db.query("categories").collect();
    for (const cat of categories) {
      const newId = mapping[cat.id];
      if (newId) {
        // Since id is a field on the categories document, patch it
        await ctx.db.patch(cat._id, { id: newId });
      }
    }

    // 2. Migrate products table categories
    const products = await ctx.db.query("products").collect();
    let productCount = 0;
    for (const p of products) {
      const newCat = mapping[p.category];
      if (newCat) {
        await ctx.db.patch(p._id, { category: newCat });
        productCount++;
      }
    }

    return { productsMigrated: productCount };
  },
});

export const migrateCategoryDescriptions = mutation({
  args: {},
  handler: async (ctx) => {
    const categoryDescriptions: Record<string, string> = {
      "keysove-i-kalufi": "Открийте нашата богата гама от висококачествени кейсове и калъфи, осигуряващи максимална защита и неповторим стил за вашия телефон.",
      "protektori-za-ekran": "Изключително здрави закалени стъклени протектори за екран, предпазващи дисплея от надраскване, пукнатини и силни удари без загуба на чувствителност.",
      "aksesoari-za-avtomobili": "Удобни магнитни и механични поставки, безжични зарядни и други важни аксесоари за безопасно и комфортно пътуване във вашия автомобил.",
      "bezzhichni-zaryadni": "Модерни и бързи безжични зарядни устройства, съвместими с MagSafe и Qi стандарти за максимално улеснение в ежедневието ви.",
      "zaryadni-ustroystva": "Висококачествени адаптери за стена и кола с технологии за бързо зареждане Power Delivery и Quick Charge за всички ваши устройства.",
      "kabeli-za-zaryadane": "Издръжливи кабелни решения с текстилна оплетка и подсилени краища за бърз трансфер на данни и сигурно захранване без прекъсване.",
      "postavki-za-byuro": "Ергономични метални и пластмасови поставки за бюро, подходящи за видео разговори, гледане на съдържание и удобна ежедневна работа.",
      "selfi-stikove": "Стабилни и леки селфи стикове с вграден трипод и Bluetooth дистанционно управление за заснемане на перфектните моменти навсякъде.",
      "popsoket-i-vrazki": "Практични попсокети, пръстени и стилни връзки за ръка за по-сигурен захват и уникална персонализация на вашия смартфон.",
      "vanshni-baterii": "Мощни преносими батерии с голям капацитет и бързо безжично или жично зареждане, за да бъдете винаги свързани в движение."
    };

    const categories = await ctx.db.query("categories").collect();
    let count = 0;
    for (const cat of categories) {
      const defaultDesc = categoryDescriptions[cat.id];
      if (defaultDesc) {
        await ctx.db.patch(cat._id, {
          description: cat.description || defaultDesc,
          seoTitle: cat.seoTitle || (cat.name + " | CaseKing"),
          seoDescription: cat.seoDescription || defaultDesc,
        });
        count++;
      }
    }
    return { migrated: count };
  },
});

export const updateExistingSettings = mutation({
  args: {},
  handler: async (ctx) => {
    const setting = await ctx.db.query("homepageSettings").first();
    if (setting) {
      await ctx.db.patch(setting._id, {
        heroSubtitle: "В CaseKing ще намерите най-добрите аксесоари за телефони – висококачествени кейсове, изключително здрави протектори, зарядни устройства и бързи кабели с гарантиран произход. Пазарувайте с доставка за 3-4 работни дни и опция преглед (без тест)!"
      });
    }

    const allMeta = await ctx.db.query("pageMetadata").collect();
    let updatedCount = 0;
    for (const meta of allMeta) {
      if (meta.pageKey === "home") {
        await ctx.db.patch(meta._id, {
          description: "Добре дошли в CaseKing - най-големият избор на премиум кейсове, протектори и аксесоари за мобилни телефони. Изберете марка, модел и поръчайте с доставка за 3-4 работни дни и преглед (без тест)!"
        });
        updatedCount++;
      } else if (meta.pageKey === "za-nas") {
        await ctx.db.patch(meta._id, {
          description: "Научете повече за CaseKing, нашата визия и мисията ни да осигурим безкомпромисно качество и доставка за 3-4 работни дни на премиум телефонни аксесоари."
        });
        updatedCount++;
      } else if (meta.pageKey === "kontakti") {
        await ctx.db.patch(meta._id, {
          description: "Свържете се с CaseKing. Изпратете ни запитване през нашата контактна форма или се обадете на 0878 202 823 за консултация."
        });
        updatedCount++;
      }
    }
    return `Updated existing settings and ${updatedCount} metadata pages.`;
  }
});


