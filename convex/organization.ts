import { v } from 'convex/values';
import { mutation, type MutationCtx } from './_generated/server';
import type { Id } from './_generated/dataModel';
import { createUserHelper } from './user';

const createOrganization = async (
  ctx: MutationCtx,
  args: {
    name: string;
    subdomain: string;
    creator: Id<'users'>;
  }
) => {
  return await ctx.db.insert('organizations', {
    name: args.name,
    subdomain: args.subdomain,
    creator: args.creator,
  });
};

export const handleOrganizationOnboard = mutation({
  args: {
    neonUserId: v.string(),
    name: v.string(),
    subdomain: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await createUserHelper(ctx, {
      neonUserId: args.neonUserId,
      displayName: args.name,
    });
    await createOrganization(ctx, {
      name: args.name,
      subdomain: args.subdomain,
      creator: user,
    });
  },
});
