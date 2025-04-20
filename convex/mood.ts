import { mutation } from './_generated/server';
import { v } from 'convex/values';
import { moodLiteral } from './schema';

export const createMood = mutation({
  args: {
    mood: moodLiteral,
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const newMoodId = await ctx.db.insert('moods', {
      mood: args.mood,
      note: args.note,
    });
    return newMoodId;
  },
});
