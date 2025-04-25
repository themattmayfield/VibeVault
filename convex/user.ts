import { mutation, query, type QueryCtx } from './_generated/server';
import { v } from 'convex/values';
import { getGroupHelper } from './groups';
export const getUserHelper = async (
  ctx: QueryCtx,
  args: { neonUserId: string }
) => {
  const user = await ctx.db
    .query('users')
    .filter((q) => q.eq(q.field('neonUserId'), args.neonUserId))
    .first();

  if (!user) {
    throw new Error('User not found');
  }

  return user;
};

export const createUser = mutation({
  args: {
    neonUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.insert('users', {
      neonUserId: args.neonUserId,
      availableGroups: [],
    });
    return user;
  },
});

export const getUserGroups = query({
  args: {
    neonUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getUserHelper(ctx, args);

    const availableGroups = user.availableGroups ?? [];

    return await Promise.all(
      availableGroups.map(
        async (group) => await getGroupHelper(ctx, { groupId: group })
      )
    );
  },
});
