import { mutation, query } from './_generated/server';
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
// Queries
// ---------------------------------------------------------------------------

/**
 * Get all check-ins for a group.
 */
export const getGroupCheckIns = query({
  args: {
    groupId: v.id('groups'),
  },
  handler: async (ctx, args) => {
    const checkIns = await ctx.db
      .query('checkIns')
      .withIndex('by_group', (q) => q.eq('groupId', args.groupId))
      .take(20);

    return checkIns;
  },
});

/**
 * Get responses for a specific check-in and period (day).
 */
export const getCheckInResponses = query({
  args: {
    checkInId: v.id('checkIns'),
    period: v.string(),
  },
  handler: async (ctx, args) => {
    const responses = await ctx.db
      .query('checkInResponses')
      .withIndex('by_checkin_and_period', (q) =>
        q.eq('checkInId', args.checkInId).eq('period', args.period)
      )
      .take(100);

    // Enrich with user info
    const enriched = await Promise.all(
      responses.map(async (r) => {
        const user = await getUserHelper(ctx, { userId: r.userId });
        return {
          ...r,
          displayName: user.displayName,
          image: user.image,
        };
      })
    );

    return enriched;
  },
});

/**
 * Check if a user has already responded to a check-in for today.
 */
export const hasRespondedToday = query({
  args: {
    checkInId: v.id('checkIns'),
    userId: v.id('users'),
    period: v.string(),
  },
  handler: async (ctx, args) => {
    const responses = await ctx.db
      .query('checkInResponses')
      .withIndex('by_user_and_checkin', (q) =>
        q.eq('userId', args.userId).eq('checkInId', args.checkInId)
      )
      .take(50);

    return responses.some((r) => r.period === args.period);
  },
});

/**
 * Get pending check-ins for a user across all their groups.
 * Returns check-ins where the user hasn't responded for today's period.
 */
export const getPendingCheckIns = query({
  args: {
    userId: v.id('users'),
    organizationId: v.string(),
    today: v.string(), // "2026-03-29"
  },
  handler: async (ctx, args) => {
    // Get user's group memberships
    const memberships = await ctx.db
      .query('groupMemberInfo')
      .withIndex('by_user_id', (q) => q.eq('userId', args.userId))
      .take(50);

    const activeGroupIds = memberships
      .filter((m) => m.status === 'active')
      .map((m) => m.groupId);

    const pending: Array<{
      checkIn: Doc<'checkIns'>;
      groupName: string;
    }> = [];

    // Get all active check-ins for user's groups
    for (const groupId of activeGroupIds) {
      const group = await ctx.db.get(groupId);
      if (!group || group.organizationId !== args.organizationId) continue;

      const checkIns = await ctx.db
        .query('checkIns')
        .withIndex('by_group', (q) => q.eq('groupId', groupId))
        .take(10);

      for (const checkIn of checkIns) {
        if (!checkIn.isActive) continue;

        // Check if user has already responded today
        const responses = await ctx.db
          .query('checkInResponses')
          .withIndex('by_user_and_checkin', (q) =>
            q.eq('userId', args.userId).eq('checkInId', checkIn._id)
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
 * Create a new check-in for a group.
 */
export const createCheckIn = mutation({
  args: {
    groupId: v.id('groups'),
    title: v.optional(v.string()),
    prompt: v.optional(v.string()),
    frequency: frequencyLiteral,
    dayOfWeek: v.optional(v.number()),
    createdBy: v.id('users'),
    organizationId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('checkIns', {
      groupId: args.groupId,
      title: args.title,
      prompt: args.prompt,
      frequency: args.frequency,
      dayOfWeek: args.dayOfWeek,
      isActive: true,
      createdBy: args.createdBy,
      organizationId: args.organizationId,
    });
  },
});

/**
 * Respond to a check-in for a given period.
 */
export const respondToCheckIn = mutation({
  args: {
    checkInId: v.id('checkIns'),
    userId: v.id('users'),
    mood: moodLiteral,
    note: v.optional(v.string()),
    period: v.string(),
    organizationId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('checkInResponses', {
      checkInId: args.checkInId,
      userId: args.userId,
      mood: args.mood,
      note: args.note,
      period: args.period,
      organizationId: args.organizationId,
    });
  },
});

/**
 * Deactivate a check-in.
 */
export const deactivateCheckIn = mutation({
  args: {
    checkInId: v.id('checkIns'),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.checkInId, { isActive: false });
  },
});

/**
 * Delete a check-in and its responses.
 */
export const deleteCheckIn = mutation({
  args: {
    checkInId: v.id('checkIns'),
  },
  handler: async (ctx, args) => {
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
