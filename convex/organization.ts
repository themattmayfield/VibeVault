import { v } from 'convex/values';
import { mutation, query, type MutationCtx } from './_generated/server';
import { createUserHelper } from './user';
import { planLiteral } from './schema';

const createOrgSettings = async (
  ctx: MutationCtx,
  args: {
    betterAuthOrgId: string;
    slug: string;
    isPersonal?: boolean;
  }
) => {
  return await ctx.db.insert('orgSettings', {
    betterAuthOrgId: args.betterAuthOrgId,
    slug: args.slug,
    ...(args.isPersonal !== undefined && { isPersonal: args.isPersonal }),
  });
};

export const handleOrganizationOnboard = mutation({
  args: {
    neonUserId: v.string(),
    displayName: v.string(),
    slug: v.string(),
    betterAuthOrgId: v.string(),
    role: v.optional(v.string()),
    isPersonal: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Idempotency: skip if user already exists
    const existingUser = await ctx.db
      .query('users')
      .withIndex('by_neon_user_id', (q) => q.eq('neonUserId', args.neonUserId))
      .first();
    if (!existingUser) {
      await createUserHelper(ctx, {
        neonUserId: args.neonUserId,
        displayName: args.displayName,
        role: args.role,
      });
    }

    // Idempotency: skip if orgSettings already exists
    const existingOrg = await ctx.db
      .query('orgSettings')
      .withIndex('by_better_auth_org_id', (q) =>
        q.eq('betterAuthOrgId', args.betterAuthOrgId)
      )
      .first();
    if (!existingOrg) {
      await createOrgSettings(ctx, {
        betterAuthOrgId: args.betterAuthOrgId,
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

export const getOrgSettingsByBetterAuthOrgId = query({
  args: { betterAuthOrgId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('orgSettings')
      .withIndex('by_better_auth_org_id', (q) =>
        q.eq('betterAuthOrgId', args.betterAuthOrgId)
      )
      .first();
  },
});

export const updateOrgSettings = mutation({
  args: {
    betterAuthOrgId: v.string(),
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
      .withIndex('by_better_auth_org_id', (q) =>
        q.eq('betterAuthOrgId', args.betterAuthOrgId)
      )
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
    betterAuthOrgId: v.string(),
    plan: planLiteral,
    polarSubscriptionId: v.optional(v.string()),
    polarCustomerId: v.optional(v.string()),
    seatCount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('orgSettings')
      .withIndex('by_better_auth_org_id', (q) =>
        q.eq('betterAuthOrgId', args.betterAuthOrgId)
      )
      .first();

    if (!existing) {
      throw new Error(
        `Organization settings not found for betterAuthOrgId: ${args.betterAuthOrgId}`
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
