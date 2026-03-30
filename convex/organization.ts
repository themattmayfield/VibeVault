import { v } from 'convex/values';
import { mutation, query, type MutationCtx } from './_generated/server';
import { createUserHelper } from './user';
import { planLiteral } from './schema';

const createOrgSettings = async (
  ctx: MutationCtx,
  args: {
    clerkOrgId: string;
    slug: string;
    isPersonal?: boolean;
  }
) => {
  return await ctx.db.insert('orgSettings', {
    clerkOrgId: args.clerkOrgId,
    slug: args.slug,
    ...(args.isPersonal !== undefined && { isPersonal: args.isPersonal }),
  });
};

export const handleOrganizationOnboard = mutation({
  args: {
    clerkUserId: v.string(),
    displayName: v.string(),
    slug: v.string(),
    clerkOrgId: v.string(),
    role: v.optional(v.string()),
    isPersonal: v.optional(v.boolean()),
    email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Idempotency: skip if user already exists
    const existingUser = await ctx.db
      .query('users')
      .withIndex('by_clerk_user_id', (q) =>
        q.eq('clerkUserId', args.clerkUserId)
      )
      .first();
    if (!existingUser) {
      await createUserHelper(ctx, {
        clerkUserId: args.clerkUserId,
        displayName: args.displayName,
        role: args.role,
        email: args.email,
      });
    } else if (args.email && !existingUser.email) {
      // Backfill email for existing users who don't have one yet
      await ctx.db.patch(existingUser._id, { email: args.email });
    }

    // Idempotency: skip if orgSettings already exists
    const existingOrg = await ctx.db
      .query('orgSettings')
      .withIndex('by_clerk_org_id', (q) => q.eq('clerkOrgId', args.clerkOrgId))
      .first();
    if (!existingOrg) {
      await createOrgSettings(ctx, {
        clerkOrgId: args.clerkOrgId,
        slug: args.slug,
        isPersonal: args.isPersonal,
      });
    }
  },
});

export const getOrgSettingsBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('orgSettings')
      .withIndex('by_slug', (q) => q.eq('slug', args.slug))
      .first();
  },
});

export const getOrgSettingsByClerkOrgId = query({
  args: { clerkOrgId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('orgSettings')
      .withIndex('by_clerk_org_id', (q) => q.eq('clerkOrgId', args.clerkOrgId))
      .first();
  },
});

export const updateOrgSettings = mutation({
  args: {
    clerkOrgId: v.string(),
    branding: v.optional(
      v.object({
        logo: v.optional(v.string()),
      })
    ),
    featureFlags: v.optional(
      v.object({
        groupsEnabled: v.optional(v.boolean()),
        globalTrendsEnabled: v.optional(v.boolean()),
        publicMoodsEnabled: v.optional(v.boolean()),
        aiInsightsEnabled: v.optional(v.boolean()),
        adminDashboardEnabled: v.optional(v.boolean()),
        dataExportEnabled: v.optional(v.boolean()),
        customBrandingEnabled: v.optional(v.boolean()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('orgSettings')
      .withIndex('by_clerk_org_id', (q) => q.eq('clerkOrgId', args.clerkOrgId))
      .first();

    if (!existing) {
      throw new Error('Organization settings not found');
    }

    const updates: Record<string, unknown> = {};
    if (args.branding !== undefined) {
      updates.branding = args.branding;
    }
    if (args.featureFlags !== undefined) {
      updates.featureFlags = args.featureFlags;
    }

    await ctx.db.patch(existing._id, updates);
  },
});

/** Derive feature flags from the plan tier. */
function featureFlagsForPlan(plan: string) {
  switch (plan) {
    case 'enterprise':
      return {
        groupsEnabled: true,
        globalTrendsEnabled: true,
        publicMoodsEnabled: true,
        aiInsightsEnabled: true,
        adminDashboardEnabled: true,
        dataExportEnabled: true,
        customBrandingEnabled: true,
      };
    case 'team':
      return {
        groupsEnabled: true,
        globalTrendsEnabled: true,
        publicMoodsEnabled: true,
        aiInsightsEnabled: true,
        adminDashboardEnabled: true,
        dataExportEnabled: true,
        customBrandingEnabled: true,
      };
    case 'pro':
      return {
        groupsEnabled: true,
        globalTrendsEnabled: false,
        publicMoodsEnabled: true,
        aiInsightsEnabled: true,
        adminDashboardEnabled: false,
        dataExportEnabled: true,
        customBrandingEnabled: false,
      };
    case 'free':
    default:
      return {
        groupsEnabled: true,
        globalTrendsEnabled: false,
        publicMoodsEnabled: false,
        aiInsightsEnabled: false,
        adminDashboardEnabled: false,
        dataExportEnabled: false,
        customBrandingEnabled: false,
      };
  }
}

/**
 * Update an org's plan and sync feature flags.
 * Called by the Polar webhook handler when a subscription event fires.
 */
export const updateOrgPlan = mutation({
  args: {
    clerkOrgId: v.string(),
    plan: planLiteral,
    polarSubscriptionId: v.optional(v.string()),
    polarCustomerId: v.optional(v.string()),
    seatCount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('orgSettings')
      .withIndex('by_clerk_org_id', (q) => q.eq('clerkOrgId', args.clerkOrgId))
      .first();

    if (!existing) {
      throw new Error(
        `Organization settings not found for clerkOrgId: ${args.clerkOrgId}`
      );
    }

    await ctx.db.patch(existing._id, {
      plan: args.plan,
      ...(args.polarSubscriptionId !== undefined && {
        polarSubscriptionId: args.polarSubscriptionId,
      }),
      ...(args.polarCustomerId !== undefined && {
        polarCustomerId: args.polarCustomerId,
      }),
      ...(args.seatCount !== undefined && { seatCount: args.seatCount }),
      featureFlags: featureFlagsForPlan(args.plan),
    });
  },
});
