import {
  mutation,
  query,
  type QueryCtx,
  type MutationCtx,
} from './_generated/server';
import { v, type Infer } from 'convex/values';
import { moodLiteral } from './schema';
import type { Id } from './_generated/dataModel';
import { format } from 'date-fns-tz';
import { getUserFromNeonUserIdHelper } from './user';

async function createMoodHelper(
  ctx: MutationCtx,
  args: {
    mood: Infer<typeof moodLiteral>;
    note?: string;
    userId?: Id<'users'>;
    tags?: string[];
    group?: Id<'groups'>;
  }
) {
  const newMoodId = await ctx.db.insert('moods', {
    mood: args.mood,
    note: args.note,
    userId: args.userId,
    tags: args.tags,
    group: args.group,
  });
  return newMoodId;
}

async function getUserLast30DaysMoodsHelper(
  ctx: QueryCtx,
  args: { userId: Id<'users'> }
) {
  // Get current timestamp and timestamp from 30 days ago
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Get all moods from the last 30 days
  const moods = await ctx.db
    .query('moods')
    .filter((q) =>
      q.and(
        q.eq(q.field('userId'), args.userId),
        q.gte(q.field('_creationTime'), thirtyDaysAgo.getTime())
      )
    )
    .collect();
  return moods;
}

export const getUserLast30DaysMoods = query({
  args: {
    userId: v.id('users'),
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
    group: v.optional(v.id('groups')),
  },
  handler: async (ctx, args) => {
    const newMoodId = await createMoodHelper(ctx, args);
    return newMoodId;
  },
});

export const getUsersTotalMoodEntries = query({
  args: {
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const totalMoodEntries = await ctx.db
      .query('moods')
      .filter((q) => q.eq(q.field('userId'), args.userId))
      .collect();
    return totalMoodEntries.length;
  },
});

export const getUsersCurrentStreak = query({
  args: {
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const moods = await ctx.db
      .query('moods')
      .filter((q) => q.eq(q.field('userId'), args.userId))
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
      .filter((q) =>
        q.and(
          q.eq(q.field('userId'), args.userId),
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
  },
  handler: async (ctx, args) => {
    const moods = await ctx.db
      .query('moods')
      .filter((q) => q.eq(q.field('userId'), args.userId))
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

    // Get all moods from the last 14 days
    const moods = await ctx.db
      .query('moods')
      .filter((q) =>
        q.and(
          q.eq(q.field('userId'), args.userId),
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
      // console.log(userMoodDate);
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
      // console.log(userMoodDate);
      const formattedDate = format(userMoodDate, 'MMM dd');
      // console.log(formattedDate);
      if (trendData[formattedDate]) {
        trendData[formattedDate][mood.mood]++;
      }
    });
    // console.log(trendData);

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

export const createMoodsFromLocalStorageUsingNeonUserId = mutation({
  args: {
    neonUserId: v.string(),
    moods: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromNeonUserIdHelper(ctx, {
      neonUserId: args.neonUserId,
    });

    for (const moodId of args.moods) {
      await ctx.db.patch(moodId as Id<'moods'>, {
        userId: user._id,
      });
    }
  },
});

export const getUserMoods = query({
  args: {
    userId: v.id('users'),
  },
  returns: v.array(
    v.object({
      id: v.string(),
      mood: moodLiteral,
      note: v.optional(v.string()),
      time: v.number(),
      tags: v.optional(v.array(v.string())),
      group: v.optional(v.string()),
    })
  ),
  handler: async (ctx, args) => {
    const moods = await ctx.db
      .query('moods')
      .filter((q) => q.eq(q.field('userId'), args.userId))
      .order('desc')
      .collect();

    return moods.map((mood) => {
      return {
        id: mood._id,
        mood: mood.mood,
        note: mood.note,
        time: mood._creationTime,
        tags: mood.tags,
        group: mood.group,
      };
    });
  },
});
