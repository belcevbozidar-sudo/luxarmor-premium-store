import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const sendMessage = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const messageId = await ctx.db.insert("contactMessages", {
      name: args.name,
      email: args.email,
      phone: args.phone || "",
      message: args.message,
      createdAt: new Date().toISOString(),
      status: "unread",
    });
    return { success: true, messageId };
  },
});
