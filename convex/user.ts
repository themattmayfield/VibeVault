import { mutation } from './_generated/server';
import { v } from 'convex/values';

export const createUser = mutation({
  args: {
    neonUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.insert('users', {
      neonUserId: args.neonUserId,
    });
    return user;
  },
});
