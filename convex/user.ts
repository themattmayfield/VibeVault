import {
  mutation,
  type MutationCtx,
  query,
  type QueryCtx,
} from './_generated/server';
import { v } from 'convex/values';
import { getGroupHelper } from './groups';
import type { Doc, Id } from './_generated/dataModel';
import { moodLiteral } from './schema';

export const getUserByClerkIdHelper = async (
  ctx: QueryCtx,
  args: { clerkUserId: string }
) => {
  const user = await ctx.db
    .query('users')
    .withIndex('by_clerk_user_id', (q) => q.eq('clerkUserId', args.clerkUserId))
    .first();

  if (!user) {
    throw new Error('User not found');
  }

  return user;
};

export const createUserHelper = async (
  ctx: MutationCtx,
  args: { clerkUserId: string; displayName: string; role?: string }
) => {
  return await ctx.db.insert('users', {
    clerkUserId: args.clerkUserId,
    displayName: args.displayName,
    availableGroups: [],
    ...(args.role && { role: args.role }),
  });
};

export const getUserHelper = async (
  ctx: QueryCtx,
  args: { userId: Id<'users'> }
) => {
  const user = await ctx.db.get(args.userId);

  if (!user) {
    throw new Error('User not found');
  }

  return user;
};

export const getUserByClerkId = query({
  args: {
    clerkUserId: v.string(),
  },
  handler: async (ctx, args) => {
    return await getUserByClerkIdHelper(ctx, args);
  },
});

export const createUser = mutation({
  args: {
    clerkUserId: v.string(),
    displayName: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await createUserHelper(ctx, args);
    return user;
  },
});

export const getUserGroups = query({
  args: {
    userId: v.id('users'),
    organizationId: v.string(),
  },
  handler: async (ctx, args) => {
    // Query groupMemberInfo for all active memberships, then filter by org
    const memberships = await ctx.db
      .query('groupMemberInfo')
      .withIndex('by_user_id', (q) => q.eq('userId', args.userId))
      .filter((q) => q.eq(q.field('status'), 'active'))
      .collect();

    const groups: Doc<'groups'>[] = [];
    for (const membership of memberships) {
      const group = await ctx.db.get(membership.groupId);
      if (!group) continue;
      if (group.organizationId !== args.organizationId) continue;
      groups.push(group);
    }

    return groups;
  },
});

export const updateUserProfile = mutation({
  args: {
    userId: v.id('users'),
    displayName: v.string(),
    image: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      displayName: args.displayName,
      ...(args.image !== undefined && { image: args.image }),
    });
  },
});

export const updateUserPreferences = mutation({
  args: {
    userId: v.id('users'),
    theme: v.optional(
      v.union(v.literal('light'), v.literal('dark'), v.literal('system'))
    ),
    timezone: v.optional(v.string()),
    notificationPrefs: v.optional(
      v.object({
        emailDigest: v.optional(
          v.union(v.literal('daily'), v.literal('weekly'), v.literal('never'))
        ),
        moodReminders: v.optional(v.boolean()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const { userId, ...prefs } = args;
    await ctx.db.patch(userId, prefs);
  },
});

export const exportUserData = query({
  args: {
    userId: v.id('users'),
  },
  returns: v.object({
    user: v.object({
      displayName: v.string(),
      theme: v.optional(
        v.union(v.literal('light'), v.literal('dark'), v.literal('system'))
      ),
      timezone: v.optional(v.string()),
    }),
    moods: v.array(
      v.object({
        mood: moodLiteral,
        note: v.optional(v.string()),
        tags: v.optional(v.array(v.string())),
        time: v.number(),
      })
    ),
    insights: v.object({
      patterns: v.array(v.object({ insight: v.string(), time: v.number() })),
      triggers: v.array(v.object({ insight: v.string(), time: v.number() })),
      suggestions: v.array(v.object({ insight: v.string(), time: v.number() })),
    }),
  }),
  handler: async (ctx, args) => {
    const user = await getUserHelper(ctx, args);

    const moods = await ctx.db
      .query('moods')
      .withIndex('by_user_id', (q) => q.eq('userId', args.userId))
      .order('desc')
      .collect();

    const patterns = await ctx.db
      .query('patterns')
      .withIndex('by_user_id', (q) => q.eq('userId', args.userId))
      .collect();

    const triggers = await ctx.db
      .query('triggers')
      .withIndex('by_user_id', (q) => q.eq('userId', args.userId))
      .collect();

    const suggestions = await ctx.db
      .query('suggestions')
      .withIndex('by_user_id', (q) => q.eq('userId', args.userId))
      .collect();

    return {
      user: {
        displayName: user.displayName,
        theme: user.theme,
        timezone: user.timezone,
      },
      moods: moods.map((m) => ({
        mood: m.mood,
        note: m.note,
        tags: m.tags,
        time: m._creationTime,
      })),
      insights: {
        patterns: patterns.map((p) => ({
          insight: p.insight,
          time: p._creationTime,
        })),
        triggers: triggers.map((t) => ({
          insight: t.insight,
          time: t._creationTime,
        })),
        suggestions: suggestions.map((s) => ({
          insight: s.insight,
          time: s._creationTime,
        })),
      },
    };
  },
});

export const deleteUserData = mutation({
  args: {
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    // Delete all moods
    const moods = await ctx.db
      .query('moods')
      .withIndex('by_user_id', (q) => q.eq('userId', args.userId))
      .collect();
    for (const mood of moods) {
      await ctx.db.delete(mood._id);
    }

    // Delete all insights
    for (const table of ['patterns', 'triggers', 'suggestions'] as const) {
      const items = await ctx.db
        .query(table)
        .withIndex('by_user_id', (q) => q.eq('userId', args.userId))
        .collect();
      for (const item of items) {
        await ctx.db.delete(item._id);
      }
    }

    // Delete group memberships
    const memberships = await ctx.db.query('groupMemberInfo').collect();
    for (const m of memberships) {
      if (m.userId === args.userId) {
        await ctx.db.delete(m._id);
      }
    }

    // Delete the user record
    await ctx.db.delete(args.userId);
  },
});
