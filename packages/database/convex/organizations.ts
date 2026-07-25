import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ============================================
// Organizations
// ============================================

// Create organization (for Agency/SaaS users)
export const create = mutation({
  args: {
    name: v.string(),
    ownerId: v.id("users"),
    logoUrl: v.optional(v.string()),
    brandColor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Create the organization
    const orgId = await ctx.db.insert("organizations", {
      name: args.name,
      ownerId: args.ownerId,
      logoUrl: args.logoUrl,
      brandColor: args.brandColor,
      settings: {
        whiteLabel: false,
      },
      createdAt: now,
      updatedAt: now,
    });

    // Update owner's organizationId
    await ctx.db.patch(args.ownerId, {
      organizationId: orgId,
      updatedAt: now,
    });

    // Create team member record for owner
    await ctx.db.insert("teamMembers", {
      organizationId: orgId,
      userId: args.ownerId,
      role: "owner",
      permissions: {
        canManageClaims: true,
        canManageClients: true,
        canSendMessages: true,
        canViewReports: true,
        canManageTeam: true,
        canAccessApi: true,
      },
      invitedAt: now,
      joinedAt: now,
      status: "active",
    });

    return orgId;
  },
});

// Get organization by ID
export const get = query({
  args: { id: v.id("organizations") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Get organization by owner
export const getByOwner = query({
  args: { ownerId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("organizations")
      .withIndex("by_owner", (q) => q.eq("ownerId", args.ownerId))
      .first();
  },
});

// Update organization
export const update = mutation({
  args: {
    id: v.id("organizations"),
    name: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
    brandColor: v.optional(v.string()),
    customDomain: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

    // Filter out undefined values
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );

    await ctx.db.patch(id, {
      ...filteredUpdates,
      updatedAt: Date.now(),
    });
  },
});

// Update organization settings
export const updateSettings = mutation({
  args: {
    id: v.id("organizations"),
    settings: v.object({
      whiteLabel: v.optional(v.boolean()),
      defaultEscalationSchedule: v.optional(v.array(v.number())),
    }),
  },
  handler: async (ctx, args) => {
    const org = await ctx.db.get(args.id);
    if (!org) throw new Error("Organization not found");

    await ctx.db.patch(args.id, {
      settings: {
        whiteLabel: args.settings.whiteLabel ?? org.settings?.whiteLabel ?? false,
        defaultEscalationSchedule: args.settings.defaultEscalationSchedule ?? org.settings?.defaultEscalationSchedule,
        automationRules: org.settings?.automationRules,
      },
      updatedAt: Date.now(),
    });
  },
});

// Delete organization
export const remove = mutation({
  args: { id: v.id("organizations") },
  handler: async (ctx, args) => {
    const org = await ctx.db.get(args.id);
    if (!org) throw new Error("Organization not found");

    // Remove all team members
    const teamMembers = await ctx.db
      .query("teamMembers")
      .withIndex("by_org", (q) => q.eq("organizationId", args.id))
      .collect();

    for (const member of teamMembers) {
      // Clear organizationId from user
      await ctx.db.patch(member.userId, {
        organizationId: undefined,
        updatedAt: Date.now(),
      });
      // Delete team member record
      await ctx.db.delete(member._id);
    }

    // Delete organization
    await ctx.db.delete(args.id);
  },
});

// ============================================
// Team Members
// ============================================

// Invite team member
export const inviteTeamMember = mutation({
  args: {
    organizationId: v.id("organizations"),
    userId: v.id("users"),
    role: v.union(v.literal("admin"), v.literal("member")),
    invitedBy: v.id("users"),
    permissions: v.optional(
      v.object({
        canManageClaims: v.boolean(),
        canManageClients: v.boolean(),
        canSendMessages: v.boolean(),
        canViewReports: v.boolean(),
        canManageTeam: v.boolean(),
        canAccessApi: v.boolean(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check if user is already a member
    const existing = await ctx.db
      .query("teamMembers")
      .withIndex("by_org_and_user", (q) =>
        q.eq("organizationId", args.organizationId).eq("userId", args.userId)
      )
      .first();

    if (existing) {
      throw new Error("User is already a member of this organization");
    }

    // Default permissions based on role
    const defaultPermissions = args.role === "admin"
      ? {
          canManageClaims: true,
          canManageClients: true,
          canSendMessages: true,
          canViewReports: true,
          canManageTeam: true,
          canAccessApi: true,
        }
      : {
          canManageClaims: true,
          canManageClients: true,
          canSendMessages: true,
          canViewReports: false,
          canManageTeam: false,
          canAccessApi: false,
        };

    // Create team member record
    const memberId = await ctx.db.insert("teamMembers", {
      organizationId: args.organizationId,
      userId: args.userId,
      role: args.role,
      permissions: args.permissions || defaultPermissions,
      invitedBy: args.invitedBy,
      invitedAt: now,
      status: "pending",
    });

    return memberId;
  },
});

// Accept team invitation
export const acceptInvitation = mutation({
  args: {
    memberId: v.id("teamMembers"),
  },
  handler: async (ctx, args) => {
    const member = await ctx.db.get(args.memberId);
    if (!member) throw new Error("Invitation not found");
    if (member.status !== "pending") throw new Error("Invitation is no longer pending");

    const now = Date.now();

    // Update team member status
    await ctx.db.patch(args.memberId, {
      status: "active",
      joinedAt: now,
    });

    // Update user's organizationId
    await ctx.db.patch(member.userId, {
      organizationId: member.organizationId,
      updatedAt: now,
    });
  },
});

// Get team members for organization
export const getTeamMembers = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    const members = await ctx.db
      .query("teamMembers")
      .withIndex("by_org", (q) => q.eq("organizationId", args.organizationId))
      .collect();

    // Fetch user details for each member
    const membersWithUsers = await Promise.all(
      members.map(async (member) => {
        const user = await ctx.db.get(member.userId);
        return {
          ...member,
          user: user
            ? {
                id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                imageUrl: user.imageUrl,
              }
            : null,
        };
      })
    );

    return membersWithUsers;
  },
});

// Update team member role
export const updateTeamMemberRole = mutation({
  args: {
    memberId: v.id("teamMembers"),
    role: v.union(v.literal("admin"), v.literal("member")),
  },
  handler: async (ctx, args) => {
    const member = await ctx.db.get(args.memberId);
    if (!member) throw new Error("Team member not found");
    if (member.role === "owner") throw new Error("Cannot change owner role");

    await ctx.db.patch(args.memberId, {
      role: args.role,
    });
  },
});

// Update team member permissions
export const updateTeamMemberPermissions = mutation({
  args: {
    memberId: v.id("teamMembers"),
    permissions: v.object({
      canManageClaims: v.boolean(),
      canManageClients: v.boolean(),
      canSendMessages: v.boolean(),
      canViewReports: v.boolean(),
      canManageTeam: v.boolean(),
      canAccessApi: v.boolean(),
    }),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.memberId, {
      permissions: args.permissions,
    });
  },
});

// Remove team member
export const removeTeamMember = mutation({
  args: {
    memberId: v.id("teamMembers"),
  },
  handler: async (ctx, args) => {
    const member = await ctx.db.get(args.memberId);
    if (!member) throw new Error("Team member not found");
    if (member.role === "owner") throw new Error("Cannot remove organization owner");

    // Clear user's organizationId
    await ctx.db.patch(member.userId, {
      organizationId: undefined,
      updatedAt: Date.now(),
    });

    // Delete team member record
    await ctx.db.delete(args.memberId);
  },
});

// Suspend team member
export const suspendTeamMember = mutation({
  args: {
    memberId: v.id("teamMembers"),
  },
  handler: async (ctx, args) => {
    const member = await ctx.db.get(args.memberId);
    if (!member) throw new Error("Team member not found");
    if (member.role === "owner") throw new Error("Cannot suspend organization owner");

    await ctx.db.patch(args.memberId, {
      status: "suspended",
    });
  },
});

// Reactivate team member
export const reactivateTeamMember = mutation({
  args: {
    memberId: v.id("teamMembers"),
  },
  handler: async (ctx, args) => {
    const member = await ctx.db.get(args.memberId);
    if (!member) throw new Error("Team member not found");

    await ctx.db.patch(args.memberId, {
      status: "active",
    });
  },
});
