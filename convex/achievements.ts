import { internalMutation, query, type MutationCtx } from './_generated/server';
import { v } from 'convex/values';
import type { Id } from './_generated/dataModel';

// ---------------------------------------------------------------------------
// Achievement definitions (seed data)
// ---------------------------------------------------------------------------

export const ACHIEVEMENT_DEFINITIONS = [
  // Streak achievements
  {
    key: 'streak_3',
    name: 'Starter',
    description: 'Log your mood for 3 consecutive days',
    icon: '🔥',
    category: 'streak' as const,
    threshold: 3,
  },
  {
    key: 'streak_7',
    name: 'Week Warrior',
    description: '7-day logging streak',
    icon: '⚡',
    category: 'streak' as const,
    threshold: 7,
  },
  {
    key: 'streak_14',
    name: 'Fortnight Focus',
    description: '14-day logging streak',
    icon: '🌟',
    category: 'streak' as const,
    threshold: 14,
  },
  {
    key: 'streak_30',
    name: 'Monthly Master',
    description: '30-day logging streak',
    icon: '🏆',
    category: 'streak' as const,
    threshold: 30,
  },
  {
    key: 'streak_100',
    name: 'Centurion',
    description: '100-day logging streak',
    icon: '💎',
    category: 'streak' as const,
    threshold: 100,
  },
  // Logging achievements
  {
    key: 'total_10',
    name: 'Getting Started',
    description: 'Log 10 mood entries',
    icon: '📝',
    category: 'logging' as const,
    threshold: 10,
  },
  {
    key: 'total_50',
    name: 'Dedicated',
    description: 'Log 50 mood entries',
    icon: '📊',
    category: 'logging' as const,
    threshold: 50,
  },
  {
    key: 'total_100',
    name: 'Committed',
    description: 'Log 100 mood entries',
    icon: '🎯',
    category: 'logging' as const,
    threshold: 100,
  },
  {
    key: 'mood_variety',
    name: 'Full Spectrum',
    description: 'Use all 9 different moods',
    icon: '🌈',
    category: 'logging' as const,
    threshold: 9,
  },
  // Social achievements
  {
    key: 'first_group',
    name: 'Social Butterfly',
    description: 'Join your first group',
    icon: '🦋',
    category: 'social' as const,
    threshold: 1,
  },
  // Insight achievements
  {
    key: 'first_journal',
    name: 'Reflector',
    description: 'Write your first journal entry',
    icon: '📖',
    category: 'insight' as const,
    threshold: 1,
  },
  {
    key: 'first_goal',
    name: 'Goal Setter',
    description: 'Set your first goal',
    icon: '🎯',
    category: 'insight' as const,
    threshold: 1,
  },
  {
    key: 'journal_10',
    name: 'Deep Thinker',
    description: 'Write 10 journal entries',
    icon: '🧠',
    category: 'insight' as const,
    threshold: 10,
  },
] as const;

// ---------------------------------------------------------------------------
// Seed achievements table
// ---------------------------------------------------------------------------

export const seedAchievements = internalMutation({
  args: {},
  handler: async (ctx) => {
    for (const def of ACHIEVEMENT_DEFINITIONS) {
      const existing = await ctx.db
        .query('achievements')
        .withIndex('by_key', (q) => q.eq('key', def.key))
        .first();

      if (!existing) {
        await ctx.db.insert('achievements', {
          key: def.key,
          name: def.name,
          description: def.description,
          icon: def.icon,
          category: def.category,
          threshold: def.threshold,
        });
      }
    }
  },
});

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * Get all earned achievements for a user in an org.
 */
export const getUserAchievements = query({
  args: {
    userId: v.id('users'),
    organizationId: v.string(),
  },
  handler: async (ctx, args) => {
    const earned = await ctx.db
      .query('userAchievements')
      .withIndex('by_org_and_user', (q) =>
        q.eq('organizationId', args.organizationId).eq('userId', args.userId)
      )
      .take(50);

    return earned;
  },
});

/**
 * Get all achievement definitions.
 */
export const getAllAchievements = query({
  args: {},
  handler: async (ctx) => {
    const achievements = await ctx.db.query('achievements').take(50);
    return achievements;
  },
});

// ---------------------------------------------------------------------------
// Achievement checking (called after mood creation, journal creation, etc.)
// ---------------------------------------------------------------------------

async function hasAchievement(
  ctx: MutationCtx,
  userId: Id<'users'>,
  key: string
): Promise<boolean> {
  const existing = await ctx.db
    .query('userAchievements')
    .withIndex('by_user_and_key', (q) =>
      q.eq('userId', userId).eq('achievementKey', key)
    )
    .first();
  return !!existing;
}

async function awardAchievement(
  ctx: MutationCtx,
  userId: Id<'users'>,
  organizationId: string,
  key: string
) {
  const already = await hasAchievement(ctx, userId, key);
  if (already) return false;

  await ctx.db.insert('userAchievements', {
    userId,
    achievementKey: key,
    earnedAt: Date.now(),
    organizationId,
  });
  return true;
}

/**
 * Check and award achievements after a mood is logged.
 * Called internally after createMood.
 */
export const checkMoodAchievements = internalMutation({
  args: {
    userId: v.id('users'),
    organizationId: v.string(),
    currentStreak: v.number(),
    totalMoods: v.number(),
    uniqueMoodCount: v.number(),
  },
  handler: async (ctx, args) => {
    const newlyEarned: string[] = [];

    // Streak achievements
    const streakThresholds = [3, 7, 14, 30, 100];
    for (const threshold of streakThresholds) {
      if (args.currentStreak >= threshold) {
        const key = `streak_${threshold}`;
        const awarded = await awardAchievement(
          ctx,
          args.userId,
          args.organizationId,
          key
        );
        if (awarded) newlyEarned.push(key);
      }
    }

    // Total mood achievements
    const totalThresholds = [10, 50, 100];
    for (const threshold of totalThresholds) {
      if (args.totalMoods >= threshold) {
        const key = `total_${threshold}`;
        const awarded = await awardAchievement(
          ctx,
          args.userId,
          args.organizationId,
          key
        );
        if (awarded) newlyEarned.push(key);
      }
    }

    // Mood variety achievement
    if (args.uniqueMoodCount >= 9) {
      const awarded = await awardAchievement(
        ctx,
        args.userId,
        args.organizationId,
        'mood_variety'
      );
      if (awarded) newlyEarned.push('mood_variety');
    }

    return newlyEarned;
  },
});

/**
 * Check and award achievements after a journal entry is created.
 */
export const checkJournalAchievements = internalMutation({
  args: {
    userId: v.id('users'),
    organizationId: v.string(),
    totalJournals: v.number(),
  },
  handler: async (ctx, args) => {
    const newlyEarned: string[] = [];

    if (args.totalJournals >= 1) {
      const awarded = await awardAchievement(
        ctx,
        args.userId,
        args.organizationId,
        'first_journal'
      );
      if (awarded) newlyEarned.push('first_journal');
    }

    if (args.totalJournals >= 10) {
      const awarded = await awardAchievement(
        ctx,
        args.userId,
        args.organizationId,
        'journal_10'
      );
      if (awarded) newlyEarned.push('journal_10');
    }

    return newlyEarned;
  },
});

/**
 * Check goal achievement after a goal is created.
 */
export const checkGoalAchievements = internalMutation({
  args: {
    userId: v.id('users'),
    organizationId: v.string(),
  },
  handler: async (ctx, args) => {
    const awarded = await awardAchievement(
      ctx,
      args.userId,
      args.organizationId,
      'first_goal'
    );
    return awarded ? ['first_goal'] : [];
  },
});

/**
 * Check group achievement after joining a group.
 */
export const checkGroupAchievements = internalMutation({
  args: {
    userId: v.id('users'),
    organizationId: v.string(),
  },
  handler: async (ctx, args) => {
    const awarded = await awardAchievement(
      ctx,
      args.userId,
      args.organizationId,
      'first_group'
    );
    return awarded ? ['first_group'] : [];
  },
});
