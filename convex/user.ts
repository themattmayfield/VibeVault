import {
  mutation,
  type MutationCtx,
  query,
  type QueryCtx,
} from './_generated/server';
import { v } from 'convex/values';
import { getGroupHelper } from './groups';
import type { Doc, Id } from './_generated/dataModel';
import { moodLiteral, moodContextValidator } from './schema';

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
  args: {
    clerkUserId: string;
    displayName: string;
    role?: string;
    email?: string;
  }
) => {
  return await ctx.db.insert('users', {
    clerkUserId: args.clerkUserId,
    displayName: args.displayName,
    ...(args.role && { role: args.role }),
    ...(args.email && { email: args.email }),
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

/**
 * Self-healing email sync. Backfills the email on the Convex user doc.
 *
 * Tries two sources in order:
 * 1. The `email` argument (passed from the Clerk Backend API via a server function)
 * 2. The JWT identity's `email` claim (works once the Clerk JWT template is updated)
 *
 * No-ops if the user already has an email stored.
 */
export const syncUserEmail = mutation({
  args: {
    email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_user_id', (q) =>
        q.eq('clerkUserId', identity.subject)
      )
      .first();

    if (!user) return null;

    // Already has email -- nothing to do
    if (user.email) return null;

    // Prefer the explicit argument, fall back to the JWT claim
    const resolvedEmail = args.email || identity.email;
    if (resolvedEmail) {
      await ctx.db.patch(user._id, { email: resolvedEmail });
    }

    return null;
  },
});

export const createUser = mutation({
  args: {
    clerkUserId: v.string(),
    displayName: v.string(),
    email: v.optional(v.string()),
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
    displayName: v.string(),
    image: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }
    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_user_id', (q) =>
        q.eq('clerkUserId', identity.subject)
      )
      .first();
    if (!user) {
      throw new Error('User not found');
    }
    await ctx.db.patch(user._id, {
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
        reminderTime: v.optional(v.string()),
        lastDigestSentAt: v.optional(v.number()),
        lastReminderSentAt: v.optional(v.number()),
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
    organizationId: v.optional(v.string()),
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
        context: v.optional(moodContextValidator),
        time: v.number(),
      })
    ),
    journals: v.array(
      v.object({
        title: v.string(),
        content: v.string(),
        mood: v.optional(moodLiteral),
        tags: v.optional(v.array(v.string())),
        time: v.number(),
      })
    ),
    goals: v.array(
      v.object({
        title: v.string(),
        type: v.string(),
        status: v.string(),
        timeframe: v.string(),
        time: v.number(),
      })
    ),
    achievements: v.array(
      v.object({
        achievementKey: v.string(),
        earnedAt: v.number(),
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

    // Journals -- scoped by org if provided, otherwise all
    let journals;
    if (args.organizationId) {
      journals = await ctx.db
        .query('journals')
        .withIndex('by_org_and_user', (q) =>
          q
            .eq('organizationId', args.organizationId as string)
            .eq('userId', args.userId)
        )
        .order('desc')
        .collect();
    } else {
      // Fallback: collect all and filter
      const all = await ctx.db.query('journals').collect();
      journals = all.filter((j) => j.userId === args.userId);
    }

    // Goals -- scoped by org if provided
    let goals;
    if (args.organizationId) {
      goals = await ctx.db
        .query('goals')
        .withIndex('by_org_and_user', (q) =>
          q
            .eq('organizationId', args.organizationId as string)
            .eq('userId', args.userId)
        )
        .order('desc')
        .collect();
    } else {
      const all = await ctx.db.query('goals').collect();
      goals = all.filter((g) => g.userId === args.userId);
    }

    // Achievements earned by this user
    const achievements = await ctx.db
      .query('userAchievements')
      .withIndex('by_user_and_key', (q) => q.eq('userId', args.userId))
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
        context: m.context,
        time: m._creationTime,
      })),
      journals: journals.map((j) => ({
        title: j.title,
        content: j.content,
        mood: j.mood,
        tags: j.tags,
        time: j._creationTime,
      })),
      goals: goals.map((g) => ({
        title: g.title,
        type: g.type,
        status: g.status,
        timeframe: g.timeframe,
        time: g._creationTime,
      })),
      achievements: achievements.map((a) => ({
        achievementKey: a.achievementKey,
        earnedAt: a.earnedAt,
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
