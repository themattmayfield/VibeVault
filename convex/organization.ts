import { v } from 'convex/values';
import { mutation, query, type MutationCtx } from './_generated/server';
import { createUserHelper } from './user';

const createOrgSettings = async (
  ctx: MutationCtx,
  args: {
    betterAuthOrgId: string;
    slug: string;
  }
) => {
  return await ctx.db.insert('orgSettings', {
    betterAuthOrgId: args.betterAuthOrgId,
    slug: args.slug,
  });
};

export const handleOrganizationOnboard = mutation({
  args: {
    neonUserId: v.string(),
    displayName: v.string(),
    slug: v.string(),
    betterAuthOrgId: v.string(),
    role: v.optional(v.string()),
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
