import { mutation, query, type QueryCtx } from './_generated/server';
import type { Id } from './_generated/dataModel';
import { v } from 'convex/values';
import { getUserHelper } from './user';

export const getGroupHelper = async (
  ctx: QueryCtx,
  args: { groupId: Id<'groups'> }
) => {
  const group = await ctx.db
    .query('groups')
    .filter((q) => q.eq(q.field('_id'), args.groupId))
    .first();

  if (!group) {
    throw new Error('Group not found');
  }

  return group;
};

export const createGroup = mutation({
  args: {
    name: v.string(),
    isPrivate: v.boolean(),
    description: v.optional(v.string()),
    image: v.optional(v.string()),
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const user = await getUserHelper(ctx, { userId: args.userId });

    const group = await ctx.db.insert('groups', {
      name: args.name,
      description: args.description,
      isPrivate: args.isPrivate,
      image: args.image,
      members: [user._id],
      admins: [user._id],
      removedMembers: [],
    });

    const usersCurrentGroups = user.availableGroups ?? [];

    await ctx.db.patch(user._id, {
      availableGroups: [...usersCurrentGroups, group],
    });

    return group;
  },
});

export const getUsersGroups = query({
  args: {
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const user = await getUserHelper(ctx, { userId: args.userId });

    if (!user) {
      throw new Error('User not found');
    }

    const availableGroups = user.availableGroups ?? [];

    const userGroups = await Promise.all(
      availableGroups.map(async (groupId) => {
        const group = await getGroupHelper(ctx, { groupId });

        // const firstThreeMembers = group.members.slice(0, 3);
        // const getMembers = await Promise.all(
        //   firstThreeMembers.map(async (memberId) => {
        //     // const member =
        //     //   await sql`SELECT * FROM users WHERE neonUserId = ${memberId}`;

        //     return {
        //       image: member?.[0]?.image,
        //       name: member?.[0]?.name,
        //     };
        //   })
        // );
        // console.log({ getMembers });

        return {
          ...group,
        };
      })
    );

    return userGroups;
  },
});
