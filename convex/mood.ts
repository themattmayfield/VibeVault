import { mutation, query } from './_generated/server';
import { v } from 'convex/values';
import { moodLiteral } from './schema';
export const createMood = mutation({
  args: {
    mood: moodLiteral,
    note: v.optional(v.string()),
    neonUserId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const newMoodId = await ctx.db.insert('moods', {
      mood: args.mood,
      note: args.note,
      neonUserId: args.neonUserId,
    });
    return newMoodId;
  },
});

export const getUsersTotalMoodEntries = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    console.log({ identity });
    const totalMoodEntries = await ctx.db.query('moods').collect();
    return totalMoodEntries.length;
  },
});
