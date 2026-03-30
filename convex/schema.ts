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

export const moodContextValidator = v.object({
  sleepQuality: v.optional(
    v.union(
      v.literal('poor'),
      v.literal('fair'),
      v.literal('good'),
      v.literal('great')
    )
  ),
  exercise: v.optional(v.boolean()),
  socialInteraction: v.optional(
    v.union(v.literal('none'), v.literal('some'), v.literal('lots'))
  ),
  workload: v.optional(
    v.union(v.literal('light'), v.literal('normal'), v.literal('heavy'))
  ),
  weather: v.optional(
    v.union(
      v.literal('sunny'),
      v.literal('cloudy'),
      v.literal('rainy'),
      v.literal('snowy')
    )
  ),
});

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
    context: v.optional(moodContextValidator),
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
  journals: defineTable({
    title: v.string(),
    content: v.string(),
    mood: v.optional(moodLiteral),
    moodEntryId: v.optional(v.id('moods')),
    tags: v.optional(v.array(v.string())),
    userId: v.id('users'),
    organizationId: v.string(),
  }).index('by_org_and_user', ['organizationId', 'userId']),
  goals: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    type: v.union(
      v.literal('mood_target'),
      v.literal('streak'),
      v.literal('custom')
    ),
    targetMood: v.optional(moodLiteral),
    targetDirection: v.optional(
      v.union(v.literal('increase'), v.literal('decrease'))
    ),
    targetCount: v.optional(v.number()),
    timeframe: v.union(v.literal('weekly'), v.literal('monthly')),
    status: v.union(
      v.literal('active'),
      v.literal('completed'),
      v.literal('abandoned')
    ),
    userId: v.id('users'),
    organizationId: v.string(),
  }).index('by_org_and_user', ['organizationId', 'userId']),
  achievements: defineTable({
    key: v.string(),
    name: v.string(),
    description: v.string(),
    icon: v.string(),
    category: v.union(
      v.literal('streak'),
      v.literal('logging'),
      v.literal('social'),
      v.literal('insight')
    ),
    threshold: v.number(),
  }).index('by_key', ['key']),
  userAchievements: defineTable({
    userId: v.id('users'),
    achievementKey: v.string(),
    earnedAt: v.number(),
    organizationId: v.string(),
  })
    .index('by_org_and_user', ['organizationId', 'userId'])
    .index('by_user_and_key', ['userId', 'achievementKey']),
  checkIns: defineTable({
    groupId: v.id('groups'),
    title: v.optional(v.string()),
    prompt: v.optional(v.string()),
    frequency: v.union(
      v.literal('daily'),
      v.literal('weekly'),
      v.literal('biweekly'),
      v.literal('monthly')
    ),
    dayOfWeek: v.optional(v.number()), // 0-6 for weekly
    isActive: v.boolean(),
    createdBy: v.id('users'),
    organizationId: v.string(),
  }).index('by_group', ['groupId']),
  checkInResponses: defineTable({
    checkInId: v.id('checkIns'),
    userId: v.id('users'),
    mood: moodLiteral,
    note: v.optional(v.string()),
    period: v.string(), // "2026-03-29" -- the day this response covers
    organizationId: v.string(),
  })
    .index('by_checkin_and_period', ['checkInId', 'period'])
    .index('by_user_and_checkin', ['userId', 'checkInId']),
});
