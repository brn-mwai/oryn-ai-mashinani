import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// List clients for a user with cursor pagination
export const list = query({
  args: {
    userId: v.id("users"),
    status: v.optional(
      v.union(
        v.literal("active"),
        v.literal("owing"),
        v.literal("paid"),
        v.literal("archived")
      )
    ),
    limit: v.optional(v.number()),
    cursor: v.optional(v.id("clients")),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 20, 100); // Cap at 100

    let query;
    if (args.status) {
      query = ctx.db
        .query("clients")
        .withIndex("by_user_and_status", (q) =>
          q.eq("userId", args.userId).eq("status", args.status!)
        )
        .order("desc");
    } else {
      query = ctx.db
        .query("clients")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .order("desc");
    }

    const clients = await query.take(limit + 1);
    const hasMore = clients.length > limit;
    const data = hasMore ? clients.slice(0, limit) : clients;
    const nextCursor = hasMore ? data[data.length - 1]._id : null;

    return {
      data,
      hasMore,
      nextCursor,
    };
  },
});

// Get single client
export const get = query({
  args: { id: v.id("clients") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Get client with claims
export const getWithClaims = query({
  args: { id: v.id("clients") },
  handler: async (ctx, args) => {
    const client = await ctx.db.get(args.id);
    if (!client) return null;

    const claims = await ctx.db
      .query("claims")
      .withIndex("by_client", (q) => q.eq("clientId", args.id))
      .collect();

    return { client, claims };
  },
});

// Create new client
export const create = mutation({
  args: {
    userId: v.id("users"),
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(
      v.object({
        street: v.optional(v.string()),
        city: v.optional(v.string()),
        state: v.optional(v.string()),
        postalCode: v.optional(v.string()),
        country: v.string(),
      })
    ),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("clients", {
      userId: args.userId,
      name: args.name,
      email: args.email,
      phone: args.phone,
      address: args.address,
      notes: args.notes,
      totalOwed: 0,
      totalPaid: 0,
      status: "active",
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Update client
export const update = mutation({
  args: {
    id: v.id("clients"),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(
      v.object({
        street: v.optional(v.string()),
        city: v.optional(v.string()),
        state: v.optional(v.string()),
        postalCode: v.optional(v.string()),
        country: v.string(),
      })
    ),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

// Archive client
export const archive = mutation({
  args: { id: v.id("clients") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: "archived",
      updatedAt: Date.now(),
    });
  },
});

// Get client stats
export const getStats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const clients = await ctx.db
      .query("clients")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const owing = clients.filter((c) => c.status === "owing");
    const paid = clients.filter((c) => c.status === "paid");

    return {
      totalClients: clients.length,
      owingClients: owing.length,
      paidClients: paid.length,
      totalOwed: clients.reduce((sum, c) => sum + c.totalOwed, 0),
      totalPaid: clients.reduce((sum, c) => sum + c.totalPaid, 0),
    };
  },
});

// Get client by WhatsApp number
export const getByWhatsapp = query({
  args: { whatsapp: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("clients")
      .withIndex("by_whatsapp", (q) => q.eq("whatsapp", args.whatsapp))
      .first();
  },
});

// Get client by phone number
export const getByPhone = query({
  args: { phone: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("clients")
      .withIndex("by_phone", (q) => q.eq("phone", args.phone))
      .first();
  },
});

// Get client by email
export const getByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("clients")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
  },
});

// Update last response time
export const updateLastResponse = mutation({
  args: { id: v.id("clients") },
  handler: async (ctx, args) => {
    const client = await ctx.db.get(args.id);
    if (!client) throw new Error("Client not found");

    // Calculate response rate based on last contact and response times
    const now = Date.now();
    let responseRate = client.responseRate ?? 0;

    // If they responded within 24 hours of being contacted, good response rate
    if (client.lastContactedAt && (now - client.lastContactedAt) < 24 * 60 * 60 * 1000) {
      responseRate = Math.min(100, responseRate + 10);
    }

    await ctx.db.patch(args.id, {
      lastResponseAt: now,
      responseRate,
      updatedAt: now,
    });
  },
});
