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
  v.literal('anxious'),
  v.literal('pessimistic')
);

export default defineSchema({
  moods: defineTable({
    mood: moodLiteral,
    note: v.optional(v.string()),
  }),
});
