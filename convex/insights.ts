import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

export const getTodaysInsight = query({
  args: {
    table: v.union(
      v.literal('patterns'),
      v.literal('triggers'),
      v.literal('suggestions')
    ),
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    // Get the start of today in milliseconds (UTC)
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const startOfToday = today.getTime();

    // Get the end of today in milliseconds (UTC)
    const tomorrow = new Date(today);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    const endOfToday = tomorrow.getTime();

    const item = await ctx.db
      .query(args.table)
      .filter((q) =>
        q.and(
          q.eq(q.field('userId'), args.userId),
          q.gte(q.field('_creationTime'), startOfToday),
          q.lt(q.field('_creationTime'), endOfToday)
        )
      )
      .first();
    return item;
  },
});

export const createInsight = mutation({
  args: {
    table: v.union(
      v.literal('patterns'),
      v.literal('triggers'),
      v.literal('suggestions')
    ),
    content: v.string(),
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert(args.table, {
      insight: args.content,
      userId: args.userId,
    });
  },
});
