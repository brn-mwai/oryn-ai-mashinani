import { v } from "convex/values";
import { query } from "./_generated/server";

// Unified search across claims, clients, and messages
export const searchAll = query({
  args: {
    userId: v.id("users"),
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const searchLimit = args.limit ?? 10;
    const searchQuery = args.query.toLowerCase().trim();

    if (!searchQuery) {
      return { claims: [], clients: [], messages: [], payments: [] };
    }

    // Search claims by title using search index
    const claimResults = await ctx.db
      .query("claims")
      .withSearchIndex("search_title", (q) =>
        q.search("title", args.query).eq("userId", args.userId)
      )
      .take(searchLimit);

    // Search clients by name
    const allClients = await ctx.db
      .query("clients")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const clientResults = allClients
      .filter((c) => {
        const name = c.name?.toLowerCase() || "";
        const email = c.email?.toLowerCase() || "";
        const phone = c.phone || "";
        return (
          name.includes(searchQuery) ||
          email.includes(searchQuery) ||
          phone.includes(searchQuery)
        );
      })
      .slice(0, searchLimit);

    // Search messages by content
    const allMessages = await ctx.db
      .query("messages")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .take(100); // Limit for performance

    const messageResults = allMessages
      .filter((m) => {
        const content = m.content?.toLowerCase() || "";
        const subject = m.subject?.toLowerCase() || "";
        return content.includes(searchQuery) || subject.includes(searchQuery);
      })
      .slice(0, searchLimit);

    // Get payments and filter by claim/client names
    const allPayments = await ctx.db
      .query("payments")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .take(100);

    // For payments, we need to match against claim titles
    const paymentResults: typeof allPayments = [];
    for (const payment of allPayments) {
      if (paymentResults.length >= searchLimit) break;
      const claim = await ctx.db.get(payment.claimId);
      if (claim && claim.title.toLowerCase().includes(searchQuery)) {
        paymentResults.push(payment);
      }
    }

    return {
      claims: claimResults,
      clients: clientResults,
      messages: messageResults,
      payments: paymentResults,
    };
  },
});

// Quick search for autocomplete (faster, fewer results)
export const quickSearch = query({
  args: {
    userId: v.id("users"),
    query: v.string(),
  },
  handler: async (ctx, args) => {
    const searchQuery = args.query.toLowerCase().trim();

    if (!searchQuery || searchQuery.length < 2) {
      return [];
    }

    type SearchResult = {
      type: "claim" | "client" | "payment";
      id: string;
      title: string;
      subtitle: string;
      href: string;
    };

    const results: SearchResult[] = [];

    // Search claims
    const claims = await ctx.db
      .query("claims")
      .withSearchIndex("search_title", (q) =>
        q.search("title", args.query).eq("userId", args.userId)
      )
      .take(5);

    for (const claim of claims) {
      results.push({
        type: "claim",
        id: claim._id,
        title: claim.title,
        subtitle: `$${claim.amount.toLocaleString()} • ${claim.status}`,
        href: `/dashboard/claims/${claim._id}`,
      });
    }

    // Search clients
    const allClients = await ctx.db
      .query("clients")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .take(50);

    const matchingClients = allClients
      .filter((c) => {
        const name = c.name?.toLowerCase() || "";
        const email = c.email?.toLowerCase() || "";
        return name.includes(searchQuery) || email.includes(searchQuery);
      })
      .slice(0, 5);

    for (const client of matchingClients) {
      results.push({
        type: "client",
        id: client._id,
        title: client.name,
        subtitle: client.email || client.phone || "No contact info",
        href: `/dashboard/clients/${client._id}`,
      });
    }

    return results;
  },
});
