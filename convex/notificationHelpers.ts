import { v } from 'convex/values';
import { internalMutation, internalQuery } from './_generated/server';

// ---------------------------------------------------------------------------
// Internal queries (called from actions via ctx.runQuery)
// ---------------------------------------------------------------------------

/** Fetch all users who have mood reminders enabled and have an email. */
export const getUsersWithRemindersEnabled = internalQuery({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query('users').take(5000);
    return users.filter(
      (u) => u.email && u.notificationPrefs?.moodReminders === true
    );
  },
});

/** Fetch all users who have a daily email digest enabled and have an email. */
export const getUsersWithDailyDigest = internalQuery({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query('users').take(5000);
    return users.filter(
      (u) => u.email && u.notificationPrefs?.emailDigest === 'daily'
    );
  },
});

/** Fetch all users who have a weekly email digest enabled and have an email. */
export const getUsersWithWeeklyDigest = internalQuery({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query('users').take(5000);
    return users.filter(
      (u) => u.email && u.notificationPrefs?.emailDigest === 'weekly'
    );
  },
});

/** Check if a user has logged a mood today. */
export const hasUserLoggedMoodToday = internalQuery({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const mood = await ctx.db
      .query('moods')
      .withIndex('by_user_id', (q) => q.eq('userId', args.userId))
      .order('desc')
      .first();

    if (!mood) return false;
    return mood._creationTime >= today.getTime();
  },
});

/** Get a user's mood summary for the last N days. */
export const getUserMoodSummary = internalQuery({
  args: {
    userId: v.id('users'),
    days: v.number(),
  },
  handler: async (ctx, args) => {
    const cutoff = new Date(Date.now() - args.days * 24 * 60 * 60 * 1000);

    const moods = await ctx.db
      .query('moods')
      .withIndex('by_user_id', (q) => q.eq('userId', args.userId))
      .order('desc')
      .take(500);

    const recentMoods = moods.filter(
      (m) => m._creationTime >= cutoff.getTime()
    );

    if (recentMoods.length === 0) {
      return {
        totalEntries: 0,
        moodCounts: {} as Record<string, number>,
        mostCommonMood: null as string | null,
        daysWithEntries: 0,
        streak: 0,
      };
    }

    // Count each mood
    const moodCounts: Record<string, number> = {};
    for (const m of recentMoods) {
      moodCounts[m.mood] = (moodCounts[m.mood] || 0) + 1;
    }

    // Most common mood
    let mostCommonMood: string | null = null;
    let maxCount = 0;
    for (const [mood, count] of Object.entries(moodCounts)) {
      if (count > maxCount) {
        maxCount = count;
        mostCommonMood = mood;
      }
    }

    // Count unique days with entries
    const uniqueDays = new Set(
      recentMoods.map((m) => {
        const d = new Date(m._creationTime);
        return `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`;
      })
    );

    // Calculate current streak
    let streak = 0;
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    for (let i = 0; i < args.days; i++) {
      const checkDate = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const dateKey = `${checkDate.getUTCFullYear()}-${checkDate.getUTCMonth()}-${checkDate.getUTCDate()}`;
      if (uniqueDays.has(dateKey)) {
        streak++;
      } else if (i === 0) {
      } else {
        break;
      }
    }

    return {
      totalEntries: recentMoods.length,
      moodCounts,
      mostCommonMood,
      daysWithEntries: uniqueDays.size,
      streak,
    };
  },
});

// ---------------------------------------------------------------------------
// Internal mutations to update delivery timestamps
// ---------------------------------------------------------------------------

export const markReminderSent = internalMutation({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return;
    await ctx.db.patch(user._id, {
      notificationPrefs: {
        ...user.notificationPrefs,
        lastReminderSentAt: Date.now(),
      },
    });
  },
});

export const markDigestSent = internalMutation({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return;
    await ctx.db.patch(user._id, {
      notificationPrefs: {
        ...user.notificationPrefs,
        lastDigestSentAt: Date.now(),
      },
    });
  },
});
