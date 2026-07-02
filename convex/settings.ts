import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getHero = query({
  args: {},
  handler: async (ctx) => {
    const setting = await ctx.db.query("homepageSettings").first();
    if (!setting) {
      return {
        heroTitle: `CaseKing - Премиум <span style="color: var(--gold);">Аксесоари за Телефони</span>`,
        heroSubtitle: "В CaseKing ще намерите най-добрите аксесоари за телефони – висококачествени кейсове, изключително здрави протектори, зарядни устройства и бързи кабели с гарантиран произход. Пазарувайте с доставка за 3-4 работни дни и опция преглед (без тест)!",
      };
    }
    return setting;
  },
});

export const updateHero = mutation({
  args: { heroTitle: v.string(), heroSubtitle: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("homepageSettings").first();
    if (existing) {
      await ctx.db.patch(existing._id, {
        heroTitle: args.heroTitle,
        heroSubtitle: args.heroSubtitle,
      });
      return existing._id;
    } else {
      return await ctx.db.insert("homepageSettings", {
        heroTitle: args.heroTitle,
        heroSubtitle: args.heroSubtitle,
      });
    }
  },
});

export const getAllPageMetadata = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("pageMetadata").collect();
  },
});

export const updatePageMetadata = mutation({
  args: {
    pageKey: v.string(),
    title: v.string(),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("pageMetadata")
      .withIndex("by_pageKey", (q) => q.eq("pageKey", args.pageKey))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        title: args.title,
        description: args.description,
      });
      return existing._id;
    } else {
      return await ctx.db.insert("pageMetadata", {
        pageKey: args.pageKey,
        title: args.title,
        description: args.description,
      });
    }
  },
});
