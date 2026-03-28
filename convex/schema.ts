import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export const moodLiteral = v.union(
  v.literal('happy'),
  v.literal('excited'),
  v.literal('calm'),
  v.literal('neutral'),
  v.literal('tired'),
  v.literal('stressed'),
  v.literal('sad'),
  v.literal('angry'),
  v.literal('anxious')
);

const groupRoleLiteral = v.union(
  v.literal('owner'),
  v.literal('admin'),
  v.literal('member')
);

const groupMemberStatus = v.union(
  v.literal('active'),
  v.literal('invited'),
  v.literal('left'),
  v.literal('requested'),
  v.literal('removed'),
  v.literal('banned')
);

export default defineSchema({
  // App-specific org settings. Better Auth (Neon Postgres) owns the canonical
  // org/membership/invitation data. This table stores org config for the app.
  orgSettings: defineTable({
    betterAuthOrgId: v.string(), // links to Better Auth organization.id
    slug: v.string(), // org URL slug, e.g. "acme" -> /org/acme
    branding: v.optional(
      v.object({
        logo: v.optional(v.string()),
      })
    ),
    featureFlags: v.optional(
      v.object({
        groupsEnabled: v.optional(v.boolean()),
        globalTrendsEnabled: v.optional(v.boolean()),
        publicMoodsEnabled: v.optional(v.boolean()),
      })
    ),
  })
    .index('by_slug', ['slug'])
    .index('by_better_auth_org_id', ['betterAuthOrgId']),
  users: defineTable({
    neonUserId: v.string(),
    displayName: v.string(),
    image: v.optional(v.string()),
    role: v.optional(v.string()),
    availableGroups: v.optional(v.array(v.id('groups'))),
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
  }).index('by_neon_user_id', ['neonUserId']),
  groups: defineTable({
    name: v.string(),
    isPrivate: v.boolean(),
    description: v.optional(v.string()),
    image: v.optional(v.string()),
    creator: v.id('users'),
    organizationId: v.optional(v.string()), // Better Auth org ID for multi-tenant scoping
  }).index('by_organization', ['organizationId']),
  groupMemberInfo: defineTable({
    userId: v.id('users'),
    groupId: v.id('groups'),
    role: groupRoleLiteral,
    status: groupMemberStatus,
  }).index('by_user_id_and_group_id', ['userId', 'groupId']),
  moods: defineTable({
    mood: moodLiteral,
    note: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    group: v.optional(v.id('groups')),
    userId: v.optional(v.id('users')),
    organizationId: v.optional(v.string()), // Better Auth org ID for multi-tenant scoping
  })
    .index('by_user_id', ['userId'])
    .index('by_org_and_user', ['organizationId', 'userId']),
  patterns: defineTable({
    insight: v.string(),
    userId: v.optional(v.id('users')),
  }).index('by_user_id', ['userId']),
  triggers: defineTable({
    insight: v.string(),
    userId: v.optional(v.id('users')),
  }).index('by_user_id', ['userId']),
  suggestions: defineTable({
    insight: v.string(),
    userId: v.optional(v.id('users')),
  }).index('by_user_id', ['userId']),
});
