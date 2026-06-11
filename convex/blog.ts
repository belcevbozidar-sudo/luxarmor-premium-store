import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Public queries
export const getPublished = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("blogPosts")
      .withIndex("by_published", (q) => q.eq("isPublished", true))
      .collect();
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const post = await ctx.db
      .query("blogPosts")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
    if (!post || !post.isPublished) return null;
    return post;
  },
});

export const getLatest = query({
  args: { limit: v.number() },
  handler: async (ctx, args) => {
    const posts = await ctx.db
      .query("blogPosts")
      .withIndex("by_published", (q) => q.eq("isPublished", true))
      .collect();
    
    // Sort manually by createdAt desc since we don't have an index on both published and createdAt
    return posts
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, args.limit);
  },
});

// Admin queries
export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("blogPosts").collect();
  },
});

// Admin mutations
export const create = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("blogPosts", args);
  },
});

export const update = mutation({
  args: {
    id: v.string(),
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
  },
  handler: async (ctx, args) => {
    const { id, ...data } = args;
    const dbId = ctx.db.normalizeId("blogPosts", id);
    if (!dbId) throw new Error("Invalid blog post ID");
    await ctx.db.patch(dbId, data);
    return "Blog post updated successfully";
  },
});

export const remove = mutation({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    const dbId = ctx.db.normalizeId("blogPosts", args.id);
    if (!dbId) throw new Error("Invalid blog post ID");
    await ctx.db.delete(dbId);
    return "Blog post deleted successfully";
  },
});
