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

export const groupRoleLiteral = v.union(
  v.literal('owner'),
  v.literal('admin'),
  v.literal('member')
);

export const groupMemberStatus = v.union(
  v.literal('active'),
  v.literal('invited'),
  v.literal('left'),
  v.literal('requested'),
  v.literal('removed'),
  v.literal('banned')
);

export default defineSchema({
  users: defineTable({
    neonUserId: v.string(),
    displayName: v.string(),
    image: v.optional(v.string()),
    availableGroups: v.optional(v.array(v.id('groups'))),
  }).index('by_neon_user_id', ['neonUserId']),
  groups: defineTable({
    name: v.string(),
    isPrivate: v.boolean(),
    description: v.optional(v.string()),
    image: v.optional(v.string()),
    creator: v.id('users'),
  }),
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
  }).index('by_user_id', ['userId']),
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
