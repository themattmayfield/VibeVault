import { mutation, query } from './_generated/server';
import { v } from 'convex/values';
import { moodLiteral } from './schema';

const goalTypeLiteral = v.union(
  v.literal('mood_target'),
  v.literal('streak'),
  v.literal('custom')
);

const goalStatusLiteral = v.union(
  v.literal('active'),
  v.literal('completed'),
  v.literal('abandoned')
);

const timeframeLiteral = v.union(v.literal('weekly'), v.literal('monthly'));

const targetDirectionLiteral = v.union(
  v.literal('increase'),
  v.literal('decrease')
);

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * Get all active goals for a user in an org.
 */
export const getActiveGoals = query({
  args: {
    userId: v.id('users'),
    organizationId: v.string(),
  },
  handler: async (ctx, args) => {
    const goals = await ctx.db
      .query('goals')
      .withIndex('by_org_and_user', (q) =>
        q.eq('organizationId', args.organizationId).eq('userId', args.userId)
      )
      .order('desc')
      .take(50);

    return goals.filter((g) => g.status === 'active');
  },
});

/**
 * Get all goals (any status) for a user in an org.
 */
export const getUserGoals = query({
  args: {
    userId: v.id('users'),
    organizationId: v.string(),
  },
  handler: async (ctx, args) => {
    const goals = await ctx.db
      .query('goals')
      .withIndex('by_org_and_user', (q) =>
        q.eq('organizationId', args.organizationId).eq('userId', args.userId)
      )
      .order('desc')
      .take(100);

    return goals;
  },
});

/**
 * Count active goals for a user in an org. Used for plan limit enforcement.
 */
export const getActiveGoalCount = query({
  args: {
    userId: v.id('users'),
    organizationId: v.string(),
  },
  handler: async (ctx, args) => {
    const goals = await ctx.db
      .query('goals')
      .withIndex('by_org_and_user', (q) =>
        q.eq('organizationId', args.organizationId).eq('userId', args.userId)
      )
      .collect();

    return goals.filter((g) => g.status === 'active').length;
  },
});

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export const createGoal = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    type: goalTypeLiteral,
    targetMood: v.optional(moodLiteral),
    targetDirection: v.optional(targetDirectionLiteral),
    targetCount: v.optional(v.number()),
    timeframe: timeframeLiteral,
    userId: v.id('users'),
    organizationId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('goals', {
      title: args.title,
      description: args.description,
      type: args.type,
      targetMood: args.targetMood,
      targetDirection: args.targetDirection,
      targetCount: args.targetCount,
      timeframe: args.timeframe,
      status: 'active',
      userId: args.userId,
      organizationId: args.organizationId,
    });
  },
});

export const updateGoalStatus = mutation({
  args: {
    goalId: v.id('goals'),
    status: goalStatusLiteral,
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.goalId, { status: args.status });
  },
});

export const deleteGoal = mutation({
  args: {
    goalId: v.id('goals'),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.goalId);
  },
});
