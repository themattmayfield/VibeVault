import {
  mutation,
  type MutationCtx,
  query,
  type QueryCtx,
} from './_generated/server';
import { v } from 'convex/values';
import { getGroupHelper } from './groups';
import type { Id } from './_generated/dataModel';

export const getUserFromNeonUserIdHelper = async (
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

export const createUserHelper = async (
  ctx: MutationCtx,
  args: { neonUserId: string; displayName: string }
) => {
  return await ctx.db.insert('users', {
    neonUserId: args.neonUserId,
    displayName: args.displayName,
    availableGroups: [],
  });
};

export const getUserHelper = async (
  ctx: QueryCtx,
  args: { userId: Id<'users'> }
) => {
  const user = await ctx.db.get(args.userId);

  if (!user) {
    throw new Error('User not found');
  }

  return user;
};

export const getUser = query({
  args: {
    neonUserId: v.string(),
  },
  handler: async (ctx, args) => {
    return await getUserFromNeonUserIdHelper(ctx, args);
  },
});

export const getUserFromNeonUserId = query({
  args: {
    neonUserId: v.string(),
  },
  handler: async (ctx, args) => {
    return await getUserFromNeonUserIdHelper(ctx, args);
  },
});

export const createUser = mutation({
  args: {
    neonUserId: v.string(),
    displayName: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await createUserHelper(ctx, args);
    return user;
  },
});

export const getUserGroups = query({
  args: {
    userId: v.id('users'),
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
