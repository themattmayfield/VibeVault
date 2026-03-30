import {
  mutation,
  query,
  type QueryCtx,
  type MutationCtx,
} from './_generated/server';
import { v, type Infer } from 'convex/values';
import { moodLiteral, moodContextValidator } from './schema';
import type { Id } from './_generated/dataModel';
import { format } from 'date-fns-tz';
import { getUserByClerkIdHelper } from './user';

async function createMoodHelper(
  ctx: MutationCtx,
  args: {
    mood: Infer<typeof moodLiteral>;
    note?: string;
    userId?: Id<'users'>;
    tags?: string[];
    context?: Infer<typeof moodContextValidator>;
    group?: Id<'groups'>;
    isPublic?: boolean;
    organizationId?: string;
  }
) {
  const newMoodId = await ctx.db.insert('moods', {
    mood: args.mood,
    note: args.note,
    userId: args.userId,
    tags: args.tags,
    context: args.context,
    group: args.group,
    isPublic: args.isPublic,
    organizationId: args.organizationId,
  });
  return newMoodId;
}

async function getUserLast30DaysMoodsHelper(
  ctx: QueryCtx,
  args: { userId: Id<'users'>; organizationId: string }
) {
  // Get current timestamp and timestamp from 30 days ago
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Get all moods from the last 30 days, scoped by org
  const moods = await ctx.db
    .query('moods')
    .withIndex('by_org_and_user', (q) =>
      q.eq('organizationId', args.organizationId).eq('userId', args.userId)
    )
    .filter((q) => q.gte(q.field('_creationTime'), thirtyDaysAgo.getTime()))
    .collect();
  return moods;
}

export const getUserLast30DaysMoods = query({
  args: {
    userId: v.id('users'),
    organizationId: v.string(),
  },
  handler: async (ctx, args) => {
    return getUserLast30DaysMoodsHelper(ctx, args);
  },
});

export const createMood = mutation({
  args: {
    mood: moodLiteral,
    note: v.optional(v.string()),
    userId: v.optional(v.id('users')),
    tags: v.optional(v.array(v.string())),
    context: v.optional(moodContextValidator),
    group: v.optional(v.id('groups')),
    isPublic: v.optional(v.boolean()),
    organizationId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const newMoodId = await createMoodHelper(ctx, args);
    return newMoodId;
  },
});

export const getUsersTotalMoodEntries = query({
  args: {
    userId: v.id('users'),
    organizationId: v.string(),
  },
  handler: async (ctx, args) => {
    const totalMoodEntries = await ctx.db
      .query('moods')
      .withIndex('by_org_and_user', (q) =>
        q.eq('organizationId', args.organizationId).eq('userId', args.userId)
      )
      .collect();
    return totalMoodEntries.length;
  },
});

export const getUsersCurrentStreak = query({
  args: {
    userId: v.id('users'),
    organizationId: v.string(),
  },
  handler: async (ctx, args) => {
    const moods = await ctx.db
      .query('moods')
      .withIndex('by_org_and_user', (q) =>
        q.eq('organizationId', args.organizationId).eq('userId', args.userId)
      )
      .order('desc')
      .collect();

    if (moods.length === 0) return 0;

    let streak = 1;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get the date of the most recent mood entry
    const lastMoodDate = new Date(moods[0]._creationTime);
    lastMoodDate.setHours(0, 0, 0, 0);

    // If the most recent mood is not from today or yesterday, streak is broken
    const daysSinceLastMood = Math.floor(
      (today.getTime() - lastMoodDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceLastMood > 1) return 0;

    // Check consecutive days
    for (let i = 1; i < moods.length; i++) {
      const currentDate = new Date(moods[i]._creationTime);
      currentDate.setHours(0, 0, 0, 0);

      const prevDate = new Date(moods[i - 1]._creationTime);
      prevDate.setHours(0, 0, 0, 0);

      // Calculate days between entries
      const daysDiff = Math.floor(
        (prevDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      // If entries are from the same day, continue checking
      if (daysDiff === 0) continue;

      // If entries are consecutive days, increment streak
      if (daysDiff === 1) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  },
});

export const getMostCommonMoodLast30Days = query({
  args: {
    userId: v.id('users'),
    organizationId: v.string(),
  },
  handler: async (ctx, args) => {
    const moods = await getUserLast30DaysMoodsHelper(ctx, args);

    if (moods.length === 0) {
      return null;
    }

    // Count occurrences of each mood
    const moodCounts = moods.reduce(
      (acc, curr) => {
        acc[curr.mood] = (acc[curr.mood] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    // Find the mood(s) with the highest count
    const maxCount = Math.max(...Object.values(moodCounts));
    const mostCommonMoods = Object.entries(moodCounts)
      .filter(([_, count]) => count === maxCount)
      .map(([mood, count]) => ({ mood, count }));

    return {
      moods: mostCommonMoods,
      totalMoods: moods.length,
      daysAnalyzed: 30,
    };
  },
});

export const getMoodToday = query({
  args: {
    userId: v.id('users'),
    organizationId: v.string(),
  },
  handler: async (ctx, args) => {
    // Get today's date at midnight
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get today's moods ordered by most recent first
    const moodsToday = await ctx.db
      .query('moods')
      .withIndex('by_org_and_user', (q) =>
        q.eq('organizationId', args.organizationId).eq('userId', args.userId)
      )
      .filter((q) =>
        q.and(
          q.gte(q.field('_creationTime'), today.getTime()),
          q.lt(q.field('_creationTime'), tomorrow.getTime())
        )
      )
      .order('desc')
      .take(1);

    return moodsToday[0] || null;
  },
});

export const getLastFiveMoods = query({
  args: {
    userId: v.id('users'),
    organizationId: v.string(),
  },
  handler: async (ctx, args) => {
    const moods = await ctx.db
      .query('moods')
      .withIndex('by_org_and_user', (q) =>
        q.eq('organizationId', args.organizationId).eq('userId', args.userId)
      )
      .order('desc')
      .take(5);

    if (moods.length === 0) {
      return null;
    }

    // Add relative time for each mood (e.g., "2 hours ago", "3 days ago")
    return moods.map((mood) => {
      const createdAt = new Date(mood._creationTime);
      const now = new Date();
      const diffInSeconds = Math.floor(
        (now.getTime() - createdAt.getTime()) / 1000
      );

      let relativeTime;
      if (diffInSeconds < 60) {
        relativeTime = `${diffInSeconds} seconds ago`;
      } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        relativeTime = `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
      } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        relativeTime = `${hours} hour${hours === 1 ? '' : 's'} ago`;
      } else {
        const days = Math.floor(diffInSeconds / 86400);
        relativeTime = `${days} day${days === 1 ? '' : 's'} ago`;
      }

      return {
        ...mood,
        relativeTime,
      };
    });
  },
});

export const getMoodTrends = query({
  args: {
    userId: v.id('users'),
    organizationId: v.string(),
    usersTimeZone: v.string(),
  },
  handler: async (ctx, args) => {
    // Get current timestamp in user's timezone
    const now = new Date();
    const userNow = new Date(
      now.toLocaleString('en-US', { timeZone: args.usersTimeZone })
    );
    userNow.setHours(23, 59, 59, 999); // End of today in user's timezone

    // Calculate 14 days ago in user's timezone
    const fourteenDaysAgo = new Date(userNow);
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    fourteenDaysAgo.setHours(0, 0, 0, 0); // Start of 14 days ago in user's timezone

    // Convert timezone-adjusted dates back to UTC for database query
    const startUTC = new Date(
      fourteenDaysAgo.toLocaleString('en-US', { timeZone: 'UTC' })
    );
    const endUTC = new Date(
      userNow.toLocaleString('en-US', { timeZone: 'UTC' })
    );

    // Get all moods from the last 14 days, scoped by org
    const moods = await ctx.db
      .query('moods')
      .withIndex('by_org_and_user', (q) =>
        q.eq('organizationId', args.organizationId).eq('userId', args.userId)
      )
      .filter((q) =>
        q.and(
          q.gte(q.field('_creationTime'), startUTC.getTime()),
          q.lte(q.field('_creationTime'), endUTC.getTime())
        )
      )
      .collect();

    // Initialize the result object with all dates and empty mood counts
    const trendData: Record<string, Record<string, number>> = {};
    for (let i = 0; i < 14; i++) {
      const date = new Date(userNow);
      date.setDate(date.getDate() - i);
      const userMoodDate = new Date(
        date.toLocaleString('en-US', { timeZone: args.usersTimeZone })
      );
      const formattedDate = format(userMoodDate, 'MMM dd');
      trendData[formattedDate] = {
        happy: 0,
        excited: 0,
        calm: 0,
        neutral: 0,
        tired: 0,
        stressed: 0,
        sad: 0,
        angry: 0,
        anxious: 0,
      };
    }

    // Count moods for each date, using the user's timezone
    moods.forEach((mood) => {
      const moodDate = new Date(mood._creationTime);
      const userMoodDate = new Date(
        moodDate.toLocaleString('en-US', { timeZone: args.usersTimeZone })
      );
      const formattedDate = format(userMoodDate, 'MMM dd');
      if (trendData[formattedDate]) {
        trendData[formattedDate][mood.mood]++;
      }
    });

    // Convert to array format and sort by date
    const result = Object.entries(trendData)
      .map(([date, moodCounts]) => ({
        date,
        ...moodCounts,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      trends: result,
      totalDays: 14,
      totalMoods: moods.length,
      dateRange: {
        start: startUTC.toISOString(),
        end: endUTC.toISOString(),
      },
    };
  },
});

export const createMoodsFromLocalStorage = mutation({
  args: {
    clerkUserId: v.string(),
    moods: v.array(v.string()),
    organizationId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getUserByClerkIdHelper(ctx, {
      clerkUserId: args.clerkUserId,
    });

    for (const moodId of args.moods) {
      const mood = await ctx.db.get(moodId as Id<'moods'>);
      // Only claim moods that exist and have no owner (anonymous moods)
      if (mood && !mood.userId) {
        await ctx.db.patch(mood._id, {
          userId: user._id,
          ...(args.organizationId && { organizationId: args.organizationId }),
        });
      }
    }
  },
});

// ---------------------------------------------------------------------------
// Org-wide queries for Global Trends (Team+ feature)
// ---------------------------------------------------------------------------

const MOOD_TYPES = [
  'happy',
  'excited',
  'calm',
  'neutral',
  'tired',
  'stressed',
  'sad',
  'angry',
  'anxious',
] as const;

const MIN_CONTRIBUTORS_FOR_TRENDS = 3;

/**
 * Org-wide mood stats for the Global Trends dashboard.
 * Returns total moods today, most common mood, unique contributor count,
 * and whether the privacy threshold is met.
 */
export const getOrgMoodStats = query({
  args: {
    organizationId: v.string(),
  },
  handler: async (ctx, args) => {
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const todaysMoods = await ctx.db
      .query('moods')
      .withIndex('by_organization', (q) =>
        q.eq('organizationId', args.organizationId)
      )
      .filter((q) => q.gte(q.field('_creationTime'), startOfToday.getTime()))
      .collect();

    // Count unique contributors (users who logged today)
    const uniqueContributors = new Set(
      todaysMoods.filter((m) => m.userId).map((m) => m.userId!.toString())
    );
    const contributorCount = uniqueContributors.size;
    const meetsPrivacyThreshold =
      contributorCount >= MIN_CONTRIBUTORS_FOR_TRENDS;

    if (!meetsPrivacyThreshold) {
      return {
        totalMoodsToday: todaysMoods.length,
        mostCommonMood: null,
        mostCommonMoodPercent: null,
        contributorCount,
        meetsPrivacyThreshold: false,
      };
    }

    // Count mood occurrences
    const moodCounts: Record<string, number> = {};
    for (const mood of todaysMoods) {
      moodCounts[mood.mood] = (moodCounts[mood.mood] || 0) + 1;
    }

    // Find most common
    let mostCommonMood: string | null = null;
    let maxCount = 0;
    for (const [mood, count] of Object.entries(moodCounts)) {
      if (count > maxCount) {
        maxCount = count;
        mostCommonMood = mood;
      }
    }

    const mostCommonMoodPercent =
      todaysMoods.length > 0
        ? Math.round((maxCount / todaysMoods.length) * 100)
        : null;

    return {
      totalMoodsToday: todaysMoods.length,
      mostCommonMood,
      mostCommonMoodPercent,
      contributorCount,
      meetsPrivacyThreshold: true,
    };
  },
});

/**
 * Org-wide mood distribution for the pie chart.
 * Returns an array of { mood, count } for all moods logged today.
 * Only returns data if the privacy threshold is met.
 */
export const getOrgMoodDistribution = query({
  args: {
    organizationId: v.string(),
  },
  handler: async (ctx, args) => {
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const todaysMoods = await ctx.db
      .query('moods')
      .withIndex('by_organization', (q) =>
        q.eq('organizationId', args.organizationId)
      )
      .filter((q) => q.gte(q.field('_creationTime'), startOfToday.getTime()))
      .collect();

    // Privacy check
    const uniqueContributors = new Set(
      todaysMoods.filter((m) => m.userId).map((m) => m.userId!.toString())
    );
    if (uniqueContributors.size < MIN_CONTRIBUTORS_FOR_TRENDS) {
      return { distribution: [], meetsPrivacyThreshold: false };
    }

    // Aggregate by mood type
    const moodCounts: Record<string, number> = {};
    for (const mood of todaysMoods) {
      moodCounts[mood.mood] = (moodCounts[mood.mood] || 0) + 1;
    }

    const distribution = MOOD_TYPES.filter((m) => moodCounts[m]).map((m) => ({
      mood: m,
      count: moodCounts[m],
    }));

    return { distribution, meetsPrivacyThreshold: true };
  },
});

/**
 * Org-wide mood timeline for the last 7 days.
 * Returns daily mood counts by type for the line chart.
 * Only returns data if the privacy threshold is met.
 */
export const getOrgMoodTimeline = query({
  args: {
    organizationId: v.string(),
    usersTimeZone: v.string(),
  },
  handler: async (ctx, args) => {
    // Calculate 7-day window
    const now = new Date();
    const userNow = new Date(
      now.toLocaleString('en-US', { timeZone: args.usersTimeZone })
    );
    userNow.setHours(23, 59, 59, 999);

    const sevenDaysAgo = new Date(userNow);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const startUTC = new Date(
      sevenDaysAgo.toLocaleString('en-US', { timeZone: 'UTC' })
    );
    const endUTC = new Date(
      userNow.toLocaleString('en-US', { timeZone: 'UTC' })
    );

    const moods = await ctx.db
      .query('moods')
      .withIndex('by_organization', (q) =>
        q.eq('organizationId', args.organizationId)
      )
      .filter((q) =>
        q.and(
          q.gte(q.field('_creationTime'), startUTC.getTime()),
          q.lte(q.field('_creationTime'), endUTC.getTime())
        )
      )
      .collect();

    // Privacy check -- need enough unique contributors across the window
    const uniqueContributors = new Set(
      moods.filter((m) => m.userId).map((m) => m.userId!.toString())
    );
    if (uniqueContributors.size < MIN_CONTRIBUTORS_FOR_TRENDS) {
      return { timeline: [], meetsPrivacyThreshold: false };
    }

    // Initialize 7-day buckets
    const trendData: Record<string, Record<string, number>> = {};
    for (let i = 0; i < 7; i++) {
      const date = new Date(userNow);
      date.setDate(date.getDate() - i);
      const userMoodDate = new Date(
        date.toLocaleString('en-US', { timeZone: args.usersTimeZone })
      );
      const formattedDate = format(userMoodDate, 'MMM dd');
      trendData[formattedDate] = Object.fromEntries(
        MOOD_TYPES.map((m) => [m, 0])
      );
    }

    // Bucket each mood by date
    for (const mood of moods) {
      const moodDate = new Date(mood._creationTime);
      const userMoodDate = new Date(
        moodDate.toLocaleString('en-US', { timeZone: args.usersTimeZone })
      );
      const formattedDate = format(userMoodDate, 'MMM dd');
      if (trendData[formattedDate]) {
        trendData[formattedDate][mood.mood]++;
      }
    }

    const timeline = Object.entries(trendData)
      .map(([date, moodCounts]) => ({
        date,
        ...moodCounts,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return { timeline, meetsPrivacyThreshold: true };
  },
});

export const getUserMoods = query({
  args: {
    userId: v.id('users'),
    organizationId: v.string(),
  },
  returns: v.array(
    v.object({
      id: v.string(),
      mood: moodLiteral,
      note: v.optional(v.string()),
      time: v.number(),
      tags: v.optional(v.array(v.string())),
      context: v.optional(moodContextValidator),
      group: v.optional(v.string()),
    })
  ),
  handler: async (ctx, args) => {
    const moods = await ctx.db
      .query('moods')
      .withIndex('by_org_and_user', (q) =>
        q.eq('organizationId', args.organizationId).eq('userId', args.userId)
      )
      .order('desc')
      .collect();

    return moods.map((mood) => {
      return {
        id: mood._id,
        mood: mood.mood,
        note: mood.note,
        time: mood._creationTime,
        tags: mood.tags,
        context: mood.context,
        group: mood.group,
      };
    });
  },
});
