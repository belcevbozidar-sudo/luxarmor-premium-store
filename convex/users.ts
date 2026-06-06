import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Native SHA-256 hashing using Web Crypto API
async function hashPassword(password: string) {
  const msgBuffer = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export const register = mutation({
  args: {
    email: v.string(),
    password: v.union(v.string(), v.null()),
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
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existing) {
      throw new Error("Потребител с този имейл вече съществува!");
    }

    const passwordHash = args.password ? await hashPassword(args.password) : null;
    const sessionToken = "CK_USER_SESSION_" + Math.random().toString(36).substring(2, 15);

    const userId = await ctx.db.insert("users", {
      email: args.email,
      passwordHash,
      clientType: args.clientType,
      name: args.name,
      phone: args.phone,
      address: args.address,
      googleId: args.googleId,
      companyDetails: args.companyDetails,
      sessionToken,
      createdAt: new Date().toISOString(),
    });

    return {
      success: true,
      userId,
      sessionToken,
      clientType: args.clientType,
      name: args.name,
    };
  },
});

export const login = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (!user) {
      throw new Error("Невалиден имейл или парола!");
    }

    if (!user.passwordHash) {
      throw new Error("Този имейл е регистриран през Google. Влезте с Google!");
    }

    const inputHash = await hashPassword(args.password);
    if (user.passwordHash !== inputHash) {
      throw new Error("Невалиден имейл или парола!");
    }

    const sessionToken = "CK_USER_SESSION_" + Math.random().toString(36).substring(2, 15);
    await ctx.db.patch(user._id, { sessionToken });

    return {
      success: true,
      userId: user._id,
      sessionToken,
      clientType: user.clientType,
      name: user.name,
    };
  },
});

export const googleLogin = mutation({
  args: {
    email: v.string(),
    name: v.string(),
    googleId: v.string(),
    clientType: v.optional(v.string()), // For completing registration
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    companyDetails: v.optional(
      v.object({
        name: v.string(),
        bulstat: v.string(),
        address: v.string(),
        mol: v.string(),
        vatRegistered: v.boolean(),
      })
    ),
  },
  handler: async (ctx, args) => {
    // Check if user exists by email
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    const sessionToken = "CK_USER_SESSION_" + Math.random().toString(36).substring(2, 15);

    if (user) {
      // Exist: log them in and update googleId/sessionToken
      await ctx.db.patch(user._id, {
        googleId: args.googleId,
        sessionToken,
      });

      return {
        success: true,
        userId: user._id,
        sessionToken,
        clientType: user.clientType,
        name: user.name,
      };
    }

    // If they do not exist and registration details are provided, register them
    if (args.clientType && args.phone && args.address) {
      const userId = await ctx.db.insert("users", {
        email: args.email,
        passwordHash: null,
        clientType: args.clientType,
        name: args.name,
        phone: args.phone,
        address: args.address,
        googleId: args.googleId,
        companyDetails: args.companyDetails,
        sessionToken,
        createdAt: new Date().toISOString(),
      });

      return {
        success: true,
        userId,
        sessionToken,
        clientType: args.clientType,
        name: args.name,
      };
    }

    // Needs to choose B2C/B2B account type first
    return {
      needsRegistration: true,
      email: args.email,
      name: args.name,
      googleId: args.googleId,
    };
  },
});

export const getProfile = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_session", (q) => q.eq("sessionToken", args.sessionToken))
      .first();
    return user || null;
  },
});

export const logout = mutation({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_session", (q) => q.eq("sessionToken", args.sessionToken))
      .first();

    if (user) {
      await ctx.db.patch(user._id, { sessionToken: null });
    }
    return "Logged out";
  },
});
