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

export const planLiteral = v.union(
  v.literal('free'),
  v.literal('pro'),
  v.literal('team'),
  v.literal('enterprise')
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
  // App-specific org settings. Clerk owns the canonical
  // org/membership/invitation data. This table stores org config for the app.
  orgSettings: defineTable({
    clerkOrgId: v.string(), // links to Clerk organization.id
    slug: v.string(), // org URL slug, e.g. "acme" -> /org/acme
    isPersonal: v.optional(v.boolean()), // true for auto-created personal orgs
    branding: v.optional(
      v.object({
        logo: v.optional(v.string()),
      })
    ),
    plan: v.optional(planLiteral),
    polarSubscriptionId: v.optional(v.string()),
    polarCustomerId: v.optional(v.string()),
    seatCount: v.optional(v.number()),
    featureFlags: v.optional(
      v.object({
        groupsEnabled: v.optional(v.boolean()),
        globalTrendsEnabled: v.optional(v.boolean()),
        publicMoodsEnabled: v.optional(v.boolean()),
        aiInsightsEnabled: v.optional(v.boolean()),
        adminDashboardEnabled: v.optional(v.boolean()),
        dataExportEnabled: v.optional(v.boolean()),
        customBrandingEnabled: v.optional(v.boolean()),
      })
    ),
  })
    .index('by_slug', ['slug'])
    .index('by_clerk_org_id', ['clerkOrgId']),
  users: defineTable({
    clerkUserId: v.string(),
    displayName: v.string(),
    image: v.optional(v.string()),
    role: v.optional(v.string()),
    plan: v.optional(v.union(v.literal('free'), v.literal('pro'))),
    polarSubscriptionId: v.optional(v.string()),
    polarCustomerId: v.optional(v.string()),
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
  }).index('by_clerk_user_id', ['clerkUserId']),
  groups: defineTable({
    name: v.string(),
    isPrivate: v.boolean(),
    description: v.optional(v.string()),
    image: v.optional(v.string()),
    creator: v.id('users'),
    organizationId: v.optional(v.string()), // Clerk org ID for multi-tenant scoping
  }).index('by_organization', ['organizationId']),
  groupMemberInfo: defineTable({
    userId: v.id('users'),
    groupId: v.id('groups'),
    role: groupRoleLiteral,
    status: groupMemberStatus,
  })
    .index('by_user_id_and_group_id', ['userId', 'groupId'])
    .index('by_user_id', ['userId']),
  moods: defineTable({
    mood: moodLiteral,
    note: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    group: v.optional(v.id('groups')),
    userId: v.optional(v.id('users')),
    organizationId: v.optional(v.string()), // Clerk org ID for multi-tenant scoping
  })
    .index('by_user_id', ['userId'])
    .index('by_org_and_user', ['organizationId', 'userId']),
  patterns: defineTable({
    insight: v.string(),
    userId: v.optional(v.id('users')),
    organizationId: v.optional(v.string()),
  })
    .index('by_user_id', ['userId'])
    .index('by_org_and_user', ['organizationId', 'userId']),
  triggers: defineTable({
    insight: v.string(),
    userId: v.optional(v.id('users')),
    organizationId: v.optional(v.string()),
  })
    .index('by_user_id', ['userId'])
    .index('by_org_and_user', ['organizationId', 'userId']),
  suggestions: defineTable({
    insight: v.string(),
    userId: v.optional(v.id('users')),
    organizationId: v.optional(v.string()),
  })
    .index('by_user_id', ['userId'])
    .index('by_org_and_user', ['organizationId', 'userId']),
});
