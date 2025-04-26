import { mutation, query, type QueryCtx } from './_generated/server';
import type { Id } from './_generated/dataModel';
import { v } from 'convex/values';
import { getUserHelper } from './user';
import { oneDayAgo, oneMonthAgo, oneWeekAgo } from './dateHelpers';
import { format } from 'date-fns-tz';

export const getGroupHelper = async (
  ctx: QueryCtx,
  args: { groupId: Id<'groups'> }
) => {
  const group = await ctx.db
    .query('groups')
    .filter((q) => q.eq(q.field('_id'), args.groupId))
    .first();

  if (!group) {
    throw new Error('Group not found');
  }

  return group;
};

export const getActiveGroupMembersHelper = async (
  ctx: QueryCtx,
  args: { groupId: Id<'groups'> }
) => {
  const activeMembers = await ctx.db
    .query('groupMemberInfo')
    .filter((q) => q.eq(q.field('groupId'), args.groupId))
    .filter((q) => q.eq(q.field('status'), 'active'))
    .collect();

  return activeMembers;
};

export const getGroupMemberIdsHelper = async (
  ctx: QueryCtx,
  args: { groupId: Id<'groups'> }
) => {
  const members = await getActiveGroupMembersHelper(ctx, {
    groupId: args.groupId,
  });

  return members.map((member) => member.userId);
};

export const getGroupMoodsTodayHelper = async (
  ctx: QueryCtx,
  args: { groupId: Id<'groups'> }
) => {
  // Get all moods from the last 1 day
  const moods = await ctx.db
    .query('moods')
    .filter((q) => q.eq(q.field('group'), args.groupId))
    .filter((q) => q.gte(q.field('_creationTime'), oneDayAgo.getTime()))
    .collect();

  return moods;
};

export const getGroupMoodsLast30DaysHelper = async (
  ctx: QueryCtx,
  args: { groupId: Id<'groups'> }
) => {
  // Get all moods from the last 30 days
  const moods = await ctx.db
    .query('moods')
    .filter((q) => q.eq(q.field('group'), args.groupId))
    .filter((q) => q.gte(q.field('_creationTime'), oneMonthAgo.getTime()))
    .collect();

  return moods;
};

export const getGroupTimelineLast7DaysHelper = async (
  ctx: QueryCtx,
  args: { groupId: Id<'groups'> }
) => {
  // Get all moods from the last 7 days
  const moods = await ctx.db
    .query('moods')
    .filter((q) => q.eq(q.field('group'), args.groupId))
    .filter((q) => q.gte(q.field('_creationTime'), oneWeekAgo.getTime()))
    .collect();

  return moods;
};

export const getGroupMoodsHelper = async (
  ctx: QueryCtx,
  args: { groupId: Id<'groups'>; limit?: number }
) => {
  const query = ctx.db
    .query('moods')
    .filter((q) => q.eq(q.field('group'), args.groupId))
    .order('desc');

  if (args.limit !== undefined) {
    return await query.take(args.limit);
  }

  return await query.collect();
};

export const getGroupActivityLevelHelper = async (
  ctx: QueryCtx,
  args: { groupId: Id<'groups'> }
) => {
  // Get all moods from the last month
  const monthlyMoods = await ctx.db
    .query('moods')
    .filter((q) => q.eq(q.field('group'), args.groupId))
    .filter((q) => q.gte(q.field('_creationTime'), oneMonthAgo.getTime()))
    .collect();

  // Calculate activity level based on monthly mood count
  const monthlyMoodCount = monthlyMoods.length;
  let activityLevel: 'Low' | 'Medium' | 'High';

  if (monthlyMoodCount < 10) {
    activityLevel = 'Low';
  } else if (monthlyMoodCount < 30) {
    activityLevel = 'Medium';
  } else {
    activityLevel = 'High';
  }

  return activityLevel;
};

export const getGroupQuery = query({
  args: {
    groupId: v.id('groups'),
  },
  handler: async (ctx, args) => {
    return await getGroupHelper(ctx, { groupId: args.groupId });
  },
});
export const createGroup = mutation({
  args: {
    name: v.string(),
    isPrivate: v.boolean(),
    description: v.optional(v.string()),
    image: v.optional(v.string()),
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const user = await getUserHelper(ctx, { userId: args.userId });

    const group = await ctx.db.insert('groups', {
      name: args.name,
      description: args.description,
      isPrivate: args.isPrivate,
      image: args.image,
      creator: user._id,
    });

    await ctx.db.insert('groupMemberInfo', {
      userId: user._id,
      groupId: group,
      role: 'owner',
      status: 'active',
    });

    const usersCurrentGroups = user.availableGroups ?? [];

    await ctx.db.patch(user._id, {
      availableGroups: [...usersCurrentGroups, group],
    });

    return group;
  },
});

export const getUsersGroups = query({
  args: {
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const user = await getUserHelper(ctx, { userId: args.userId });

    if (!user) {
      throw new Error('User not found');
    }

    const availableGroups = user.availableGroups ?? [];

    const userGroups = await Promise.all(
      availableGroups.map(async (groupId) => {
        const group = await getGroupHelper(ctx, { groupId });

        const activeMembers = await getActiveGroupMembersHelper(ctx, {
          groupId,
        });

        const firstThreeMembers = activeMembers.slice(0, 3);
        const getMembers = await Promise.all(
          firstThreeMembers.map(async (member) => {
            const memberUser = await getUserHelper(ctx, {
              userId: member.userId,
            });

            return {
              image: memberUser.image,
              displayName: memberUser.displayName,
            };
          })
        );

        const activityLevel = await getGroupActivityLevelHelper(ctx, {
          groupId,
        });

        return {
          ...group,
          members: getMembers,
          activityLevel,
        };
      })
    );

    return userGroups;
  },
});

export const getGroupPageContent = query({
  args: {
    groupId: v.id('groups'),
  },
  handler: async (ctx, args) => {
    const group = await getGroupHelper(ctx, { groupId: args.groupId });

    const groupMoodToday = await getGroupMoodsTodayHelper(ctx, {
      groupId: args.groupId,
    });

    const mostCommonMoodToday = groupMoodToday.reduce(
      (acc, mood) => {
        if (!acc[mood.mood]) {
          acc[mood.mood] = 0;
        }
        acc[mood.mood]++;
        return acc;
      },
      {} as Record<string, number>
    );

    const totalMoodsToday = groupMoodToday.length;
    const mostCommonMood = Object.entries(mostCommonMoodToday).reduce(
      (max, [mood, count]) =>
        count > (mostCommonMoodToday[max] || 0) ? mood : max,
      ''
    );

    const moodSummaryToday = {
      totalCount: totalMoodsToday,
      mostCommonMood: mostCommonMood || null,
    };

    const activeMembers = await getActiveGroupMembersHelper(ctx, {
      groupId: args.groupId,
    });

    const memberDetails = await Promise.all(
      activeMembers.map(async (member) => {
        const user = await getUserHelper(ctx, { userId: member.userId });
        return user;
      })
    );

    const numberOfNewMembersInLastMonth = memberDetails
      .filter((user) => user._creationTime > oneMonthAgo.getTime())
      .length.toString();

    const creator = await getUserHelper(ctx, {
      userId: group.creator,
    });

    const creatorDisplayName = creator.displayName;

    const activityLevel = await getGroupActivityLevelHelper(ctx, {
      groupId: args.groupId,
    });

    const lastFourMoods = await getGroupMoodsHelper(ctx, {
      groupId: args.groupId,
      limit: 4,
    });

    const lastFourMoodsWithUser = await Promise.all(
      lastFourMoods.map(async (mood) => {
        if (!mood.userId) {
          return null;
        }
        const user = await getUserHelper(ctx, { userId: mood.userId });
        return {
          ...mood,
          user,
        };
      })
    );

    return {
      group,
      moodSummaryToday,
      numberOfNewMembersInLastMonth,
      creatorDisplayName,
      activityLevel,
      lastFourMoodsWithUser,
    };
  },
});

export const getGroupMoodDistributionLast30Days = query({
  args: {
    groupId: v.id('groups'),
  },
  handler: async (ctx, args) => {
    const moods = await getGroupMoodsLast30DaysHelper(ctx, {
      groupId: args.groupId,
    });

    const moodDistribution = moods.map((mood) => {
      return {
        name: mood.mood,
        value: 1,
      };
    });

    return moodDistribution;
  },
});

export const getGroupTimelineLast7Days = query({
  args: {
    groupId: v.id('groups'),
    usersTimeZone: v.string(),
  },
  handler: async (ctx, args) => {
    // Get current timestamp in user's timezone
    const now = new Date();
    const userNow = new Date(
      now.toLocaleString('en-US', { timeZone: args.usersTimeZone })
    );
    userNow.setHours(23, 59, 59, 999); // End of today in user's timezone

    // Calculate 7 days ago in user's timezone
    const sevenDaysAgo = new Date(userNow);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0); // Start of 7 days ago in user's timezone

    // Convert timezone-adjusted dates back to UTC for database query
    const startUTC = new Date(
      sevenDaysAgo.toLocaleString('en-US', { timeZone: 'UTC' })
    );
    const endUTC = new Date(
      userNow.toLocaleString('en-US', { timeZone: 'UTC' })
    );

    const moods = await ctx.db
      .query('moods')
      .filter((q) => q.eq(q.field('group'), args.groupId))
      .filter((q) => q.gte(q.field('_creationTime'), startUTC.getTime()))
      .filter((q) => q.lte(q.field('_creationTime'), endUTC.getTime()))
      .collect();

    // Initialize the result object with all dates and empty mood counts
    const trendData: Record<string, Record<string, number>> = {};
    for (let i = 0; i < 7; i++) {
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

    return result;
  },
});

export const getActiveGroupMembers = query({
  args: {
    groupId: v.id('groups'),
  },
  handler: async (ctx, args) => {
    const activeMembers = await getActiveGroupMembersHelper(ctx, {
      groupId: args.groupId,
    });

    const members = await Promise.all(
      activeMembers.map(async (member) => {
        const user = await getUserHelper(ctx, { userId: member.userId });
        return {
          ...member,
          displayName: user.displayName,
          image: user.image,
        };
      })
    );
    return members;
  },
});
