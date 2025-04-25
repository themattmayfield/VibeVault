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

export default defineSchema({
  users: defineTable({
    neonUserId: v.string(),
    // displayName: v.optional(v.string()),
    // image: v.optional(v.string()),
    availableGroups: v.optional(v.array(v.id('groups'))),
  }).index('by_neon_user_id', ['neonUserId']),
  groups: defineTable({
    name: v.string(),
    isPrivate: v.boolean(),
    description: v.optional(v.string()),
    image: v.optional(v.string()),
    members: v.array(v.string()),
    admins: v.array(v.string()),
    removedMembers: v.array(v.string()),
  }),
  moods: defineTable({
    mood: moodLiteral,
    note: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    group: v.optional(v.id('groups')),
    neonUserId: v.optional(v.string()),
  }).index('by_neon_user_id', ['neonUserId']),
  patterns: defineTable({
    insight: v.string(),
    neonUserId: v.optional(v.string()),
  }).index('by_neon_user_id', ['neonUserId']),
  triggers: defineTable({
    insight: v.string(),
    neonUserId: v.optional(v.string()),
  }).index('by_neon_user_id', ['neonUserId']),
  suggestions: defineTable({
    insight: v.string(),
    neonUserId: v.optional(v.string()),
  }).index('by_neon_user_id', ['neonUserId']),
});
