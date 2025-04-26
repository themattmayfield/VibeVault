import { mutation, query, type QueryCtx } from './_generated/server';
import type { Id } from './_generated/dataModel';
import { v } from 'convex/values';
import { getUserHelper } from './user';
import { oneDayAgo, oneMonthAgo } from './dateHelpers';

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

export const getGroupMemberIdsHelper = async (
  ctx: QueryCtx,
  args: { groupId: Id<'groups'> }
) => {
  const group = await getGroupHelper(ctx, { groupId: args.groupId });
  return group.members;
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

export const getGroupMoodsHelper = async (
  ctx: QueryCtx,
  args: { groupId: Id<'groups'>; limit?: number }
) => {
  const query = ctx.db
    .query('moods')
    .filter((q) => q.eq(q.field('group'), args.groupId));

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
      members: [user._id],
      admins: [user._id],
      removedMembers: [],
      creator: user._id,
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

        const firstThreeMembers = group.members.slice(0, 3);
        const getMembers = await Promise.all(
          firstThreeMembers.map(async (memberId) => {
            const member = await getUserHelper(ctx, { userId: memberId });

            return {
              image: member?.image,
              displayName: member?.displayName,
            };
          })
        );

        return {
          ...group,
          members: getMembers,
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

    const memberDetails = await Promise.all(
      group.members.map(async (memberId) => {
        const user = await getUserHelper(ctx, { userId: memberId });
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

    return {
      group,
      moodSummaryToday,
      numberOfNewMembersInLastMonth,
      creatorDisplayName,
      activityLevel,
    };
  },
});

export const getGroupsLastFourMoods = query({
  args: {
    groupId: v.id('groups'),
  },
  handler: async (ctx, args) => {
    const lastFourMoods = await getGroupMoodsHelper(ctx, {
      groupId: args.groupId,
      limit: 4,
    });

    return lastFourMoods;
  },
});

export const getGroupActivityQuery = query({
  args: {
    groupId: v.id('groups'),
  },
  handler: async (ctx, args) => {
    const activityLevel = await getGroupActivityLevelHelper(ctx, {
      groupId: args.groupId,
    });

    return activityLevel;
  },
});
