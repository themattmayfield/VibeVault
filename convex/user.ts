import {
  mutation,
  type MutationCtx,
  query,
  type QueryCtx,
} from './_generated/server';
import { v } from 'convex/values';
import { getGroupHelper } from './groups';
import type { Id } from './_generated/dataModel';
import { moodLiteral } from './schema';

export const getUserFromNeonUserIdHelper = async (
  ctx: QueryCtx,
  args: { neonUserId: string }
) => {
  const user = await ctx.db
    .query('users')
    .withIndex('by_neon_user_id', (q) => q.eq('neonUserId', args.neonUserId))
    .first();

  if (!user) {
    throw new Error('User not found');
  }

  return user;
};

export const createUserHelper = async (
  ctx: MutationCtx,
  args: { neonUserId: string; displayName: string }
) => {
  return await ctx.db.insert('users', {
    neonUserId: args.neonUserId,
    displayName: args.displayName,
    availableGroups: [],
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

export const getUserFromNeonUserId = query({
  args: {
    neonUserId: v.string(),
  },
  handler: async (ctx, args) => {
    return await getUserFromNeonUserIdHelper(ctx, args);
  },
});

export const createUser = mutation({
  args: {
    neonUserId: v.string(),
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
  },
  handler: async (ctx, args) => {
    const user = await getUserHelper(ctx, args);

    const availableGroups = user.availableGroups ?? [];

    return await Promise.all(
      availableGroups.map(
        async (group) => await getGroupHelper(ctx, { groupId: group })
      )
    );
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
