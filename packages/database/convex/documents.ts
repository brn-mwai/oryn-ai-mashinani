import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// List documents for a user
export const list = query({
  args: {
    userId: v.id("users"),
    claimId: v.optional(v.id("claims")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;

    if (args.claimId) {
      return await ctx.db
        .query("documents")
        .withIndex("by_claim", (q) => q.eq("claimId", args.claimId))
        .take(limit);
    }

    return await ctx.db
      .query("documents")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(limit);
  },
});

// Get single document
export const get = query({
  args: { id: v.id("documents") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Generate upload URL
export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

// Create document record after upload
export const create = mutation({
  args: {
    userId: v.id("users"),
    claimId: v.optional(v.id("claims")),
    name: v.string(),
    type: v.union(
      v.literal("contract"),
      v.literal("invoice"),
      v.literal("receipt"),
      v.literal("proof"),
      v.literal("image"),
      v.literal("video"),
      v.literal("other")
    ),
    storageId: v.id("_storage"),
    size: v.number(),
    mimeType: v.string(),
  },
  handler: async (ctx, args) => {
    const url = await ctx.storage.getUrl(args.storageId);
    if (!url) throw new Error("Failed to get storage URL");

    const now = Date.now();
    return await ctx.db.insert("documents", {
      userId: args.userId,
      claimId: args.claimId,
      name: args.name,
      type: args.type,
      storageId: args.storageId,
      url,
      size: args.size,
      mimeType: args.mimeType,
      parsingStatus: "pending",
      parsingAttempts: 0,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Update document with parsed content and embedding
export const updateParsedContent = mutation({
  args: {
    id: v.id("documents"),
    parsedContent: v.string(),
    embedding: v.optional(v.array(v.float64())),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

// Attach document to claim
export const attachToClaim = mutation({
  args: {
    documentId: v.id("documents"),
    claimId: v.id("claims"),
  },
  handler: async (ctx, args) => {
    // Update document
    await ctx.db.patch(args.documentId, { claimId: args.claimId });

    // Update claim's document list
    const claim = await ctx.db.get(args.claimId);
    if (claim) {
      await ctx.db.patch(args.claimId, {
        documentIds: [...claim.documentIds, args.documentId],
        updatedAt: Date.now(),
      });
    }
  },
});

// Delete document
export const remove = mutation({
  args: { id: v.id("documents") },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.id);
    if (!doc) throw new Error("Document not found");

    // Remove from storage (if stored in Convex storage)
    if (doc.storageId) {
      await ctx.storage.delete(doc.storageId);
    }

    // Remove from claim if attached
    if (doc.claimId) {
      const claim = await ctx.db.get(doc.claimId);
      if (claim) {
        await ctx.db.patch(doc.claimId, {
          documentIds: claim.documentIds.filter((id) => id !== args.id),
          updatedAt: Date.now(),
        });
      }
    }

    // Delete record
    await ctx.db.delete(args.id);
  },
});

// Semantic search for documents using vector index
export const semanticSearch = query({
  args: {
    userId: v.id("users"),
    embedding: v.array(v.float64()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Use Convex vector search
    const results = await ctx.db
      .query("documents")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // Filter only documents with embeddings and calculate similarity
    const withSimilarity = results
      .filter((doc) => doc.embedding && doc.embedding.length > 0)
      .map((doc) => {
        const similarity = cosineSimilarity(args.embedding, doc.embedding!);
        return { ...doc, similarity };
      })
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, args.limit ?? 10);

    return withSimilarity;
  },
});

// Helper function for cosine similarity
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator === 0 ? 0 : dotProduct / denominator;
}
