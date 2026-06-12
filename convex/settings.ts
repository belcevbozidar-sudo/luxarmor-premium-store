import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getHero = query({
  args: {},
  handler: async (ctx) => {
    const setting = await ctx.db.query("homepageSettings").first();
    if (!setting) {
      return {
        heroTitle: `CaseKing - Премиум <span style="color: var(--gold);">Аксесоари за Телефони</span>`,
        heroSubtitle: "В CaseKing ще намерите най-добрите аксесоари за телефони – висококачествени кейсове, изключително здрави протектори, зарядни устройства и бързи кабели с гарантиран произход. Пазарувайте с бърза доставка, преглед и тест!",
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
