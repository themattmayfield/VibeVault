import {
  mutation,
  query,
  type MutationCtx,
  type QueryCtx,
} from './_generated/server';
import { api, internal } from './_generated/api';
import type { Doc, Id } from './_generated/dataModel';
import { v } from 'convex/values';
import { getUserHelper } from './user';
import { getOneDayAgo, getOneMonthAgo } from './dateHelpers';
import { format } from 'date-fns-tz';

// ---------------------------------------------------------------------------
// Plan limit constants (mirrors app/lib/plan-features.ts)
// ---------------------------------------------------------------------------

const PLAN_LIMITS: Record<
  string,
  { maxGroups: number; maxGroupMembers: number }
> = {
  free: { maxGroups: 1, maxGroupMembers: 5 },
  pro: { maxGroups: 5, maxGroupMembers: 25 },
  team: { maxGroups: Infinity, maxGroupMembers: Infinity },
  enterprise: { maxGroups: Infinity, maxGroupMembers: Infinity },
};

function getPlanLimits(plan?: string) {
  return PLAN_LIMITS[plan ?? 'free'] ?? PLAN_LIMITS.free;
}

// ---------------------------------------------------------------------------
// Auth helpers
// ---------------------------------------------------------------------------

/**
 * Authenticate the current user. Supports two modes:
 * 1. JWT auth (client-side WebSocket calls) -- uses ctx.auth.getUserIdentity()
 * 2. Clerk ID fallback (SSR via ConvexHttpClient) -- uses clerkUserId arg
 *
 * The SSR path is safe because TanStack Start's route loaders verify auth
 * via getAuthUser() before the queries execute. The clerkUserId is never
 * user-supplied in an untrusted context.
 */
async function authenticateUser(
  ctx: QueryCtx | MutationCtx,
  clerkUserId?: string
): Promise<Doc<'users'>> {
  // Try JWT auth first (works on client-side WebSocket calls)
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

/**
 * Verify that the authenticated user is an active member of the given group.
 * Returns the membership record.
 */
async function requireGroupMember(
  ctx: QueryCtx | MutationCtx,
  userId: Id<'users'>,
  groupId: Id<'groups'>
): Promise<Doc<'groupMemberInfo'>> {
  const membership = await ctx.db
    .query('groupMemberInfo')
    .withIndex('by_user_id_and_group_id', (q) =>
      q.eq('userId', userId).eq('groupId', groupId)
    )
    .first();

  if (!membership || membership.status !== 'active') {
    throw new Error('You are not an active member of this group');
  }

  return membership;
}

/**
 * Verify that the authenticated user is an owner or admin of the given group.
 */
async function requireGroupAdmin(
  ctx: QueryCtx | MutationCtx,
  userId: Id<'users'>,
  groupId: Id<'groups'>
): Promise<Doc<'groupMemberInfo'>> {
  const membership = await requireGroupMember(ctx, userId, groupId);

  if (membership.role !== 'owner' && membership.role !== 'admin') {
    throw new Error('Only group owners and admins can perform this action');
  }

  return membership;
}

// ---------------------------------------------------------------------------
// Helpers (internal, not exported as Convex endpoints)
// ---------------------------------------------------------------------------

export const getGroupHelper = async (
  ctx: QueryCtx,
  args: { groupId: Id<'groups'> }
) => {
  const group = await ctx.db.get(args.groupId);
  if (!group) {
    throw new Error('Group not found');
  }
  return group;
};

export const getActiveGroupMembersHelper = async (
  ctx: QueryCtx,
  args: { groupId: Id<'groups'> }
) => {
  const members = await ctx.db
    .query('groupMemberInfo')
    .withIndex('by_group_id', (q) => q.eq('groupId', args.groupId))
    .collect();

  return members.filter((m) => m.status === 'active');
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

const getGroupMoodsTodayHelper = async (
  ctx: QueryCtx,
  args: { groupId: Id<'groups'> }
) => {
  const oneDayAgo = getOneDayAgo();
  return await ctx.db
    .query('moods')
    .withIndex('by_group', (q) => q.eq('group', args.groupId))
    .filter((q) => q.gte(q.field('_creationTime'), oneDayAgo.getTime()))
    .collect();
};

const getGroupMoodsLast30DaysHelper = async (
  ctx: QueryCtx,
  args: { groupId: Id<'groups'> }
) => {
  const oneMonthAgo = getOneMonthAgo();
  return await ctx.db
    .query('moods')
    .withIndex('by_group', (q) => q.eq('group', args.groupId))
    .filter((q) => q.gte(q.field('_creationTime'), oneMonthAgo.getTime()))
    .collect();
};

const getGroupMoodsHelper = async (
  ctx: QueryCtx,
  args: { groupId: Id<'groups'>; limit?: number }
) => {
  const query = ctx.db
    .query('moods')
    .withIndex('by_group', (q) => q.eq('group', args.groupId))
    .order('desc');

  if (args.limit !== undefined) {
    return await query.take(args.limit);
  }
  return await query.take(200);
};

const getGroupActivityLevelHelper = async (
  ctx: QueryCtx,
  args: { groupId: Id<'groups'> }
) => {
  const monthlyMoods = await getGroupMoodsLast30DaysHelper(ctx, {
    groupId: args.groupId,
  });
  const count = monthlyMoods.length;
  if (count < 10) return 'Low' as const;
  if (count < 30) return 'Medium' as const;
  return 'High' as const;
};

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export const getGroupQuery = query({
  args: {
    groupId: v.id('groups'),
    clerkUserId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await authenticateUser(ctx, args.clerkUserId);
    await requireGroupMember(ctx, user._id, args.groupId);
    return await getGroupHelper(ctx, { groupId: args.groupId });
  },
});

export const getUsersGroups = query({
  args: {
    organizationId: v.string(),
    clerkUserId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await authenticateUser(ctx, args.clerkUserId);

    // Get all active memberships for this user
    const memberships = await ctx.db
      .query('groupMemberInfo')
      .withIndex('by_user_id', (q) => q.eq('userId', user._id))
      .collect();

    const activeMemberships = memberships.filter((m) => m.status === 'active');

    const userGroups: Array<
      Doc<'groups'> & {
        members: { image: string | undefined; displayName: string }[];
        memberCount: number;
        activityLevel: 'Low' | 'Medium' | 'High';
        userRole: 'owner' | 'admin' | 'member';
      }
    > = [];

    for (const membership of activeMemberships) {
      const group = await ctx.db.get(membership.groupId);
      if (!group) continue;
      if (group.organizationId !== args.organizationId) continue;

      const activeMembers = await getActiveGroupMembersHelper(ctx, {
        groupId: group._id,
      });
      const memberCount = activeMembers.length;

      const firstThreeMembers = activeMembers.slice(0, 3);
      const members = await Promise.all(
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
        groupId: group._id,
      });

      userGroups.push({
        ...group,
        members,
        memberCount,
        activityLevel,
        userRole: membership.role,
      });
    }

    return userGroups;
  },
});

export const getGroupPageContent = query({
  args: {
    groupId: v.id('groups'),
    clerkUserId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await authenticateUser(ctx, args.clerkUserId);
    await requireGroupMember(ctx, user._id, args.groupId);

    const group = await getGroupHelper(ctx, { groupId: args.groupId });

    const groupMoodToday = await getGroupMoodsTodayHelper(ctx, {
      groupId: args.groupId,
    });

    const mostCommonMoodToday = groupMoodToday.reduce(
      (acc, mood) => {
        if (!acc[mood.mood]) acc[mood.mood] = 0;
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

    const oneMonthAgo = getOneMonthAgo();
    const numberOfNewMembersInLastMonth = activeMembers
      .filter((m) => m._creationTime > oneMonthAgo.getTime())
      .length.toString();

    const creator = await getUserHelper(ctx, { userId: group.creator });
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
        if (!mood.userId) return null;
        const moodUser = await getUserHelper(ctx, { userId: mood.userId });
        return { ...mood, user: moodUser };
      })
    );

    // Resolve group image URL if stored in Convex storage
    let imageUrl: string | null = null;
    if (group.image) {
      imageUrl = await ctx.storage.getUrl(group.image);
    }

    return {
      group: { ...group, imageUrl },
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
    clerkUserId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await authenticateUser(ctx, args.clerkUserId);
    await requireGroupMember(ctx, user._id, args.groupId);

    const moods = await getGroupMoodsLast30DaysHelper(ctx, {
      groupId: args.groupId,
    });

    return moods.map((mood) => ({
      name: mood.mood,
      value: 1,
    }));
  },
});

export const getGroupTimelineLast7Days = query({
  args: {
    groupId: v.id('groups'),
    usersTimeZone: v.string(),
    clerkUserId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await authenticateUser(ctx, args.clerkUserId);
    await requireGroupMember(ctx, user._id, args.groupId);

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
      .withIndex('by_group', (q) => q.eq('group', args.groupId))
      .filter((q) => q.gte(q.field('_creationTime'), startUTC.getTime()))
      .filter((q) => q.lte(q.field('_creationTime'), endUTC.getTime()))
      .collect();

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

    return Object.entries(trendData)
      .map(([date, moodCounts]) => ({ date, ...moodCounts }))
      .sort((a, b) => a.date.localeCompare(b.date));
  },
});

export const getActiveGroupMembers = query({
  args: {
    groupId: v.id('groups'),
    clerkUserId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await authenticateUser(ctx, args.clerkUserId);
    await requireGroupMember(ctx, user._id, args.groupId);

    const activeMembers = await getActiveGroupMembersHelper(ctx, {
      groupId: args.groupId,
    });

    return await Promise.all(
      activeMembers.map(async (member) => {
        const memberUser = await getUserHelper(ctx, { userId: member.userId });
        return {
          ...member,
          displayName: memberUser.displayName,
          image: memberUser.image,
        };
      })
    );
  },
});

/**
 * Get discoverable (public) groups in an org that the user is NOT a member of.
 */
export const getDiscoverableGroups = query({
  args: {
    organizationId: v.string(),
    clerkUserId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await authenticateUser(ctx, args.clerkUserId);

    // Get all public groups in this org
    const publicGroups = await ctx.db
      .query('groups')
      .withIndex('by_organization', (q) =>
        q.eq('organizationId', args.organizationId)
      )
      .take(50);

    // Get user's memberships to exclude groups they're already in
    const memberships = await ctx.db
      .query('groupMemberInfo')
      .withIndex('by_user_id', (q) => q.eq('userId', user._id))
      .collect();

    const memberGroupIds = new Set(
      memberships
        .filter(
          (m) =>
            m.status === 'active' ||
            m.status === 'invited' ||
            m.status === 'requested'
        )
        .map((m) => m.groupId.toString())
    );

    const discoverable: Array<
      Doc<'groups'> & {
        memberCount: number;
        activityLevel: 'Low' | 'Medium' | 'High';
      }
    > = [];

    for (const group of publicGroups) {
      if (group.isPrivate) continue;
      if (memberGroupIds.has(group._id.toString())) continue;

      const activeMembers = await getActiveGroupMembersHelper(ctx, {
        groupId: group._id,
      });
      const activityLevel = await getGroupActivityLevelHelper(ctx, {
        groupId: group._id,
      });

      discoverable.push({
        ...group,
        memberCount: activeMembers.length,
        activityLevel,
      });
    }

    return discoverable;
  },
});

/**
 * Get pending invitations for the current user in an org.
 */
export const getUserPendingInvites = query({
  args: {
    organizationId: v.string(),
    clerkUserId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await authenticateUser(ctx, args.clerkUserId);

    const memberships = await ctx.db
      .query('groupMemberInfo')
      .withIndex('by_user_id', (q) => q.eq('userId', user._id))
      .collect();

    const invitedMemberships = memberships.filter(
      (m) => m.status === 'invited'
    );

    const invites: Array<{
      groupId: Id<'groups'>;
      groupName: string;
      groupDescription?: string;
      invitedAt: number;
      memberCount: number;
    }> = [];

    for (const membership of invitedMemberships) {
      const group = await ctx.db.get(membership.groupId);
      if (!group) continue;
      if (group.organizationId !== args.organizationId) continue;

      const activeMembers = await getActiveGroupMembersHelper(ctx, {
        groupId: group._id,
      });

      invites.push({
        groupId: group._id,
        groupName: group.name,
        groupDescription: group.description,
        invitedAt: membership._creationTime,
        memberCount: activeMembers.length,
      });
    }

    return invites;
  },
});

/**
 * Search groups by name within an org.
 */
export const searchGroups = query({
  args: {
    organizationId: v.string(),
    searchTerm: v.string(),
    clerkUserId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await authenticateUser(ctx, args.clerkUserId);

    const results = await ctx.db
      .query('groups')
      .withSearchIndex('search_name', (q) =>
        q
          .search('name', args.searchTerm)
          .eq('organizationId', args.organizationId)
      )
      .take(20);

    // Enrich with membership info
    return await Promise.all(
      results.map(async (group) => {
        const membership = await ctx.db
          .query('groupMemberInfo')
          .withIndex('by_user_id_and_group_id', (q) =>
            q.eq('userId', user._id).eq('groupId', group._id)
          )
          .first();

        const activeMembers = await getActiveGroupMembersHelper(ctx, {
          groupId: group._id,
        });

        return {
          ...group,
          memberCount: activeMembers.length,
          isMember: membership?.status === 'active',
          membershipStatus: membership?.status ?? null,
        };
      })
    );
  },
});

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export const createGroup = mutation({
  args: {
    name: v.string(),
    isPrivate: v.boolean(),
    description: v.optional(v.string()),
    image: v.optional(v.id('_storage')),
    organizationId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await authenticateUser(ctx);

    // Server-side plan limit enforcement
    if (args.organizationId) {
      const orgSettings = await ctx.db
        .query('orgSettings')
        .withIndex('by_clerk_org_id', (q) =>
          q.eq('clerkOrgId', args.organizationId!)
        )
        .first();

      const limits = getPlanLimits(orgSettings?.plan ?? undefined);

      // Count existing groups for this org that the user owns or is member of
      const existingGroups = await ctx.db
        .query('groups')
        .withIndex('by_organization', (q) =>
          q.eq('organizationId', args.organizationId!)
        )
        .collect();

      if (existingGroups.length >= limits.maxGroups) {
        throw new Error(
          `Your plan allows a maximum of ${limits.maxGroups} group(s). Please upgrade to create more.`
        );
      }
    }

    const group = await ctx.db.insert('groups', {
      name: args.name,
      description: args.description,
      isPrivate: args.isPrivate,
      image: args.image,
      creator: user._id,
      organizationId: args.organizationId,
    });

    await ctx.db.insert('groupMemberInfo', {
      userId: user._id,
      groupId: group,
      role: 'owner',
      status: 'active',
    });

    // Award the "first_group" achievement
    if (args.organizationId) {
      await ctx.scheduler.runAfter(
        0,
        internal.achievements.checkGroupAchievements,
        {
          userId: user._id,
          organizationId: args.organizationId,
        }
      );
    }

    return group;
  },
});

/**
 * Invite a user to a group. Only owners/admins can invite.
 */
export const inviteMember = mutation({
  args: {
    groupId: v.id('groups'),
    inviteeUserId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const user = await authenticateUser(ctx);
    await requireGroupAdmin(ctx, user._id, args.groupId);

    const group = await getGroupHelper(ctx, { groupId: args.groupId });

    // Check plan member limit
    if (group.organizationId) {
      const orgSettings = await ctx.db
        .query('orgSettings')
        .withIndex('by_clerk_org_id', (q) =>
          q.eq('clerkOrgId', group.organizationId!)
        )
        .first();

      const limits = getPlanLimits(orgSettings?.plan ?? undefined);
      const activeMembers = await getActiveGroupMembersHelper(ctx, {
        groupId: args.groupId,
      });

      if (activeMembers.length >= limits.maxGroupMembers) {
        throw new Error(
          `Your plan allows a maximum of ${limits.maxGroupMembers} members per group. Please upgrade to add more.`
        );
      }
    }

    // Check if already a member or invited
    const existing = await ctx.db
      .query('groupMemberInfo')
      .withIndex('by_user_id_and_group_id', (q) =>
        q.eq('userId', args.inviteeUserId).eq('groupId', args.groupId)
      )
      .first();

    if (existing) {
      if (existing.status === 'active') {
        throw new Error('User is already a member of this group');
      }
      if (existing.status === 'invited') {
        throw new Error('User has already been invited to this group');
      }
      if (existing.status === 'banned') {
        throw new Error('This user has been banned from this group');
      }
      // If left or removed, re-invite
      await ctx.db.patch(existing._id, { status: 'invited', role: 'member' });
      return existing._id;
    }

    return await ctx.db.insert('groupMemberInfo', {
      userId: args.inviteeUserId,
      groupId: args.groupId,
      role: 'member',
      status: 'invited',
    });
  },
});

/**
 * Accept an invitation to a group.
 */
export const acceptInvite = mutation({
  args: {
    groupId: v.id('groups'),
  },
  handler: async (ctx, args) => {
    const user = await authenticateUser(ctx);

    const membership = await ctx.db
      .query('groupMemberInfo')
      .withIndex('by_user_id_and_group_id', (q) =>
        q.eq('userId', user._id).eq('groupId', args.groupId)
      )
      .first();

    if (!membership || membership.status !== 'invited') {
      throw new Error('No pending invitation found for this group');
    }

    await ctx.db.patch(membership._id, { status: 'active' });

    // Award group achievement
    const group = await ctx.db.get(args.groupId);
    if (group?.organizationId) {
      await ctx.scheduler.runAfter(
        0,
        internal.achievements.checkGroupAchievements,
        {
          userId: user._id,
          organizationId: group.organizationId,
        }
      );
    }
  },
});

/**
 * Decline an invitation to a group.
 */
export const declineInvite = mutation({
  args: {
    groupId: v.id('groups'),
  },
  handler: async (ctx, args) => {
    const user = await authenticateUser(ctx);

    const membership = await ctx.db
      .query('groupMemberInfo')
      .withIndex('by_user_id_and_group_id', (q) =>
        q.eq('userId', user._id).eq('groupId', args.groupId)
      )
      .first();

    if (!membership || membership.status !== 'invited') {
      throw new Error('No pending invitation found for this group');
    }

    await ctx.db.delete(membership._id);
  },
});

/**
 * Join a public group directly.
 * For private groups, creates a join request.
 */
export const joinGroup = mutation({
  args: {
    groupId: v.id('groups'),
  },
  handler: async (ctx, args) => {
    const user = await authenticateUser(ctx);
    const group = await getGroupHelper(ctx, { groupId: args.groupId });

    // Check plan member limit
    if (group.organizationId) {
      const orgSettings = await ctx.db
        .query('orgSettings')
        .withIndex('by_clerk_org_id', (q) =>
          q.eq('clerkOrgId', group.organizationId!)
        )
        .first();

      const limits = getPlanLimits(orgSettings?.plan ?? undefined);
      const activeMembers = await getActiveGroupMembersHelper(ctx, {
        groupId: args.groupId,
      });

      if (activeMembers.length >= limits.maxGroupMembers) {
        throw new Error('This group has reached its member limit');
      }
    }

    // Check for existing membership
    const existing = await ctx.db
      .query('groupMemberInfo')
      .withIndex('by_user_id_and_group_id', (q) =>
        q.eq('userId', user._id).eq('groupId', args.groupId)
      )
      .first();

    if (existing) {
      if (existing.status === 'active') {
        throw new Error('You are already a member of this group');
      }
      if (existing.status === 'banned') {
        throw new Error('You have been banned from this group');
      }
      if (existing.status === 'requested') {
        throw new Error('You have already requested to join this group');
      }
      // Re-join if previously left or removed
      const newStatus = group.isPrivate ? 'requested' : 'active';
      await ctx.db.patch(existing._id, {
        status: newStatus as 'active' | 'requested',
        role: 'member',
      });

      if (newStatus === 'active' && group.organizationId) {
        await ctx.scheduler.runAfter(
          0,
          internal.achievements.checkGroupAchievements,
          {
            userId: user._id,
            organizationId: group.organizationId,
          }
        );
      }
      return;
    }

    const status = group.isPrivate ? 'requested' : 'active';

    await ctx.db.insert('groupMemberInfo', {
      userId: user._id,
      groupId: args.groupId,
      role: 'member',
      status: status as 'active' | 'requested',
    });

    if (status === 'active' && group.organizationId) {
      await ctx.scheduler.runAfter(
        0,
        internal.achievements.checkGroupAchievements,
        {
          userId: user._id,
          organizationId: group.organizationId,
        }
      );
    }
  },
});

/**
 * Leave a group. Prevents leaving if you're the sole owner.
 */
export const leaveGroup = mutation({
  args: {
    groupId: v.id('groups'),
  },
  handler: async (ctx, args) => {
    const user = await authenticateUser(ctx);

    const membership = await ctx.db
      .query('groupMemberInfo')
      .withIndex('by_user_id_and_group_id', (q) =>
        q.eq('userId', user._id).eq('groupId', args.groupId)
      )
      .first();

    if (!membership || membership.status !== 'active') {
      throw new Error('You are not an active member of this group');
    }

    // Prevent sole owner from leaving
    if (membership.role === 'owner') {
      const allMembers = await ctx.db
        .query('groupMemberInfo')
        .withIndex('by_group_id', (q) => q.eq('groupId', args.groupId))
        .collect();

      const owners = allMembers.filter(
        (m) => m.status === 'active' && m.role === 'owner'
      );

      if (owners.length <= 1) {
        throw new Error(
          'You are the only owner. Transfer ownership or delete the group before leaving.'
        );
      }
    }

    await ctx.db.patch(membership._id, { status: 'left' });
  },
});

/**
 * Remove a member from a group. Owner/admin only.
 */
export const removeMember = mutation({
  args: {
    groupId: v.id('groups'),
    targetUserId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const user = await authenticateUser(ctx);
    const actorMembership = await requireGroupAdmin(
      ctx,
      user._id,
      args.groupId
    );

    if (args.targetUserId === user._id) {
      throw new Error('Use leaveGroup instead of removing yourself');
    }

    const targetMembership = await ctx.db
      .query('groupMemberInfo')
      .withIndex('by_user_id_and_group_id', (q) =>
        q.eq('userId', args.targetUserId).eq('groupId', args.groupId)
      )
      .first();

    if (!targetMembership || targetMembership.status !== 'active') {
      throw new Error('User is not an active member of this group');
    }

    // Admins cannot remove owners
    if (actorMembership.role === 'admin' && targetMembership.role === 'owner') {
      throw new Error('Admins cannot remove group owners');
    }

    await ctx.db.patch(targetMembership._id, { status: 'removed' });
  },
});

/**
 * Ban a member from a group. Owner/admin only.
 */
export const banMember = mutation({
  args: {
    groupId: v.id('groups'),
    targetUserId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const user = await authenticateUser(ctx);
    const actorMembership = await requireGroupAdmin(
      ctx,
      user._id,
      args.groupId
    );

    if (args.targetUserId === user._id) {
      throw new Error('You cannot ban yourself');
    }

    const targetMembership = await ctx.db
      .query('groupMemberInfo')
      .withIndex('by_user_id_and_group_id', (q) =>
        q.eq('userId', args.targetUserId).eq('groupId', args.groupId)
      )
      .first();

    if (!targetMembership) {
      throw new Error('User is not a member of this group');
    }

    if (actorMembership.role === 'admin' && targetMembership.role === 'owner') {
      throw new Error('Admins cannot ban group owners');
    }

    await ctx.db.patch(targetMembership._id, { status: 'banned' });
  },
});

/**
 * Delete a group and all associated data. Owner only.
 */
export const deleteGroup = mutation({
  args: {
    groupId: v.id('groups'),
  },
  handler: async (ctx, args) => {
    const user = await authenticateUser(ctx);

    const membership = await ctx.db
      .query('groupMemberInfo')
      .withIndex('by_user_id_and_group_id', (q) =>
        q.eq('userId', user._id).eq('groupId', args.groupId)
      )
      .first();

    if (!membership || membership.role !== 'owner') {
      throw new Error('Only group owners can delete a group');
    }

    // Delete all memberships
    const allMemberships = await ctx.db
      .query('groupMemberInfo')
      .withIndex('by_group_id', (q) => q.eq('groupId', args.groupId))
      .collect();

    for (const m of allMemberships) {
      await ctx.db.delete(m._id);
    }

    // Delete all check-ins and their responses
    const checkIns = await ctx.db
      .query('checkIns')
      .withIndex('by_group', (q) => q.eq('groupId', args.groupId))
      .take(100);

    for (const checkIn of checkIns) {
      const responses = await ctx.db
        .query('checkInResponses')
        .withIndex('by_checkin_and_period', (q) =>
          q.eq('checkInId', checkIn._id)
        )
        .take(500);

      for (const response of responses) {
        await ctx.db.delete(response._id);
      }
      await ctx.db.delete(checkIn._id);
    }

    // Unlink moods from this group (set group to undefined)
    const groupMoods = await ctx.db
      .query('moods')
      .withIndex('by_group', (q) => q.eq('group', args.groupId))
      .take(500);

    for (const mood of groupMoods) {
      await ctx.db.patch(mood._id, { group: undefined });
    }

    // Delete the group itself
    await ctx.db.delete(args.groupId);
  },
});

/**
 * Update group details. Owner/admin only.
 */
export const updateGroup = mutation({
  args: {
    groupId: v.id('groups'),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    isPrivate: v.optional(v.boolean()),
    image: v.optional(v.id('_storage')),
  },
  handler: async (ctx, args) => {
    const user = await authenticateUser(ctx);
    await requireGroupAdmin(ctx, user._id, args.groupId);

    const updates: Partial<{
      name: string;
      description: string;
      isPrivate: boolean;
      image: Id<'_storage'>;
    }> = {};

    if (args.name !== undefined) {
      if (!args.name.trim()) throw new Error('Group name cannot be empty');
      updates.name = args.name.trim();
    }
    if (args.description !== undefined) updates.description = args.description;
    if (args.isPrivate !== undefined) updates.isPrivate = args.isPrivate;
    if (args.image !== undefined) updates.image = args.image;

    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(args.groupId, updates);
    }
  },
});

/**
 * Generate an upload URL for group images.
 */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await authenticateUser(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});
