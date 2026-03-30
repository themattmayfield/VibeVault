import {
  mutation,
  query,
  type QueryCtx,
  type MutationCtx,
} from './_generated/server';
import { v } from 'convex/values';
import { moodLiteral } from './schema';
import type { Doc } from './_generated/dataModel';
import { getUserHelper } from './user';

const frequencyLiteral = v.union(
  v.literal('daily'),
  v.literal('weekly'),
  v.literal('biweekly'),
  v.literal('monthly')
);

// ---------------------------------------------------------------------------
// Auth helpers (duplicated from groups.ts to avoid circular imports)
// ---------------------------------------------------------------------------

async function authenticateUser(
  ctx: QueryCtx | MutationCtx,
  clerkUserId?: string
): Promise<Doc<'users'>> {
  const identity = await ctx.auth.getUserIdentity();
  const lookupId = identity?.subject ?? clerkUserId;
  if (!lookupId) {
    throw new Error('Not authenticated');
  }
  const user = await ctx.db
    .query('users')
    .withIndex('by_clerk_user_id', (q) => q.eq('clerkUserId', lookupId))
    .first();
  if (!user) {
    throw new Error('User not found');
  }
  return user;
}

async function requireGroupMember(
  ctx: QueryCtx | MutationCtx,
  user: Doc<'users'>,
  groupId: Doc<'checkIns'>['groupId']
) {
  const membership = await ctx.db
    .query('groupMemberInfo')
    .withIndex('by_user_id_and_group_id', (q) =>
      q.eq('userId', user._id).eq('groupId', groupId)
    )
    .first();

  if (!membership || membership.status !== 'active') {
    throw new Error('You are not an active member of this group');
  }
  return membership;
}

async function requireGroupAdmin(
  ctx: QueryCtx | MutationCtx,
  user: Doc<'users'>,
  groupId: Doc<'checkIns'>['groupId']
) {
  const membership = await requireGroupMember(ctx, user, groupId);
  if (membership.role !== 'owner' && membership.role !== 'admin') {
    throw new Error('Only group owners and admins can perform this action');
  }
  return membership;
}

// ---------------------------------------------------------------------------
// Plan limits for check-ins
// ---------------------------------------------------------------------------

const CHECK_IN_LIMITS: Record<string, number> = {
  free: 1,
  pro: 3,
  team: Infinity,
  enterprise: Infinity,
};

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * Get all check-ins for a group (auth-gated to group members).
 */
export const getGroupCheckIns = query({
  args: {
    groupId: v.id('groups'),
    clerkUserId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await authenticateUser(ctx, args.clerkUserId);
    await requireGroupMember(ctx, user, args.groupId);

    return await ctx.db
      .query('checkIns')
      .withIndex('by_group', (q) => q.eq('groupId', args.groupId))
      .take(20);
  },
});

/**
 * Get responses for a specific check-in and period (day).
 */
export const getCheckInResponses = query({
  args: {
    checkInId: v.id('checkIns'),
    period: v.string(),
    clerkUserId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await authenticateUser(ctx, args.clerkUserId);

    // Verify user is a member of the check-in's group
    const checkIn = await ctx.db.get(args.checkInId);
    if (!checkIn) throw new Error('Check-in not found');
    await requireGroupMember(ctx, user, checkIn.groupId);

    const responses = await ctx.db
      .query('checkInResponses')
      .withIndex('by_checkin_and_period', (q) =>
        q.eq('checkInId', args.checkInId).eq('period', args.period)
      )
      .take(100);

    return await Promise.all(
      responses.map(async (r) => {
        const respUser = await getUserHelper(ctx, { userId: r.userId });
        return {
          ...r,
          displayName: respUser.displayName,
          image: respUser.image,
        };
      })
    );
  },
});

/**
 * Check if the current user has already responded to a check-in for a given period.
 */
export const hasRespondedToday = query({
  args: {
    checkInId: v.id('checkIns'),
    period: v.string(),
    clerkUserId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await authenticateUser(ctx, args.clerkUserId);

    const responses = await ctx.db
      .query('checkInResponses')
      .withIndex('by_user_and_checkin', (q) =>
        q.eq('userId', user._id).eq('checkInId', args.checkInId)
      )
      .take(50);

    return responses.some((r) => r.period === args.period);
  },
});

/**
 * Get pending check-ins for the current user across all their groups.
 */
export const getPendingCheckIns = query({
  args: {
    organizationId: v.string(),
    today: v.string(),
    clerkUserId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await authenticateUser(ctx, args.clerkUserId);

    const memberships = await ctx.db
      .query('groupMemberInfo')
      .withIndex('by_user_id', (q) => q.eq('userId', user._id))
      .take(50);

    const activeGroupIds = memberships
      .filter((m) => m.status === 'active')
      .map((m) => m.groupId);

    const pending: Array<{
      checkIn: Doc<'checkIns'>;
      groupName: string;
    }> = [];

    for (const groupId of activeGroupIds) {
      const group = await ctx.db.get(groupId);
      if (!group || group.organizationId !== args.organizationId) continue;

      const checkIns = await ctx.db
        .query('checkIns')
        .withIndex('by_group', (q) => q.eq('groupId', groupId))
        .take(10);

      for (const checkIn of checkIns) {
        if (!checkIn.isActive) continue;

        const responses = await ctx.db
          .query('checkInResponses')
          .withIndex('by_user_and_checkin', (q) =>
            q.eq('userId', user._id).eq('checkInId', checkIn._id)
          )
          .take(50);

        const hasResponded = responses.some((r) => r.period === args.today);
        if (!hasResponded) {
          pending.push({ checkIn, groupName: group.name });
        }
      }
    }

    return pending;
  },
});

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/**
 * Create a new check-in for a group. Owner/admin only.
 * Enforces plan limits on max check-ins per group.
 */
export const createCheckIn = mutation({
  args: {
    groupId: v.id('groups'),
    title: v.optional(v.string()),
    prompt: v.optional(v.string()),
    frequency: frequencyLiteral,
    dayOfWeek: v.optional(v.number()),
    organizationId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await authenticateUser(ctx);
    await requireGroupAdmin(ctx, user, args.groupId);

    // Server-side plan limit enforcement
    const orgSettings = await ctx.db
      .query('orgSettings')
      .withIndex('by_clerk_org_id', (q) =>
        q.eq('clerkOrgId', args.organizationId)
      )
      .first();

    const limit =
      CHECK_IN_LIMITS[orgSettings?.plan ?? 'free'] ?? CHECK_IN_LIMITS.free;

    const existingCheckIns = await ctx.db
      .query('checkIns')
      .withIndex('by_group', (q) => q.eq('groupId', args.groupId))
      .take(50);

    const activeCount = existingCheckIns.filter((c) => c.isActive).length;
    if (activeCount >= limit) {
      throw new Error(
        `Your plan allows a maximum of ${limit} active check-in(s) per group. Please upgrade to create more.`
      );
    }

    return await ctx.db.insert('checkIns', {
      groupId: args.groupId,
      title: args.title,
      prompt: args.prompt,
      frequency: args.frequency,
      dayOfWeek: args.dayOfWeek,
      isActive: true,
      createdBy: user._id,
      organizationId: args.organizationId,
    });
  },
});

/**
 * Respond to a check-in for a given period.
 * Includes server-side deduplication to prevent duplicate responses.
 */
export const respondToCheckIn = mutation({
  args: {
    checkInId: v.id('checkIns'),
    mood: moodLiteral,
    note: v.optional(v.string()),
    period: v.string(),
    organizationId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await authenticateUser(ctx);

    // Verify the check-in exists and user is a group member
    const checkIn = await ctx.db.get(args.checkInId);
    if (!checkIn) throw new Error('Check-in not found');
    if (!checkIn.isActive) throw new Error('This check-in is no longer active');
    await requireGroupMember(ctx, user, checkIn.groupId);

    // Server-side deduplication: check for existing response
    const existingResponses = await ctx.db
      .query('checkInResponses')
      .withIndex('by_user_and_checkin', (q) =>
        q.eq('userId', user._id).eq('checkInId', args.checkInId)
      )
      .take(50);

    const alreadyResponded = existingResponses.some(
      (r) => r.period === args.period
    );
    if (alreadyResponded) {
      throw new Error(
        'You have already responded to this check-in for this period'
      );
    }

    return await ctx.db.insert('checkInResponses', {
      checkInId: args.checkInId,
      userId: user._id,
      mood: args.mood,
      note: args.note,
      period: args.period,
      organizationId: args.organizationId,
    });
  },
});

/**
 * Deactivate a check-in. Owner/admin only.
 */
export const deactivateCheckIn = mutation({
  args: {
    checkInId: v.id('checkIns'),
  },
  handler: async (ctx, args) => {
    const user = await authenticateUser(ctx);

    const checkIn = await ctx.db.get(args.checkInId);
    if (!checkIn) throw new Error('Check-in not found');

    await requireGroupAdmin(ctx, user, checkIn.groupId);

    await ctx.db.patch(args.checkInId, { isActive: false });
  },
});

/**
 * Delete a check-in and its responses. Owner/admin only.
 */
export const deleteCheckIn = mutation({
  args: {
    checkInId: v.id('checkIns'),
  },
  handler: async (ctx, args) => {
    const user = await authenticateUser(ctx);

    const checkIn = await ctx.db.get(args.checkInId);
    if (!checkIn) throw new Error('Check-in not found');

    await requireGroupAdmin(ctx, user, checkIn.groupId);

    // Delete all responses
    const responses = await ctx.db
      .query('checkInResponses')
      .withIndex('by_checkin_and_period', (q) =>
        q.eq('checkInId', args.checkInId)
      )
      .take(500);

    for (const response of responses) {
      await ctx.db.delete(response._id);
    }

    await ctx.db.delete(args.checkInId);
  },
});
