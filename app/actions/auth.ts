import { createServerFn } from '@tanstack/react-start';
import { auth } from '@clerk/tanstack-react-start/server';
import { createClerkClient } from '@clerk/backend';
import { z } from 'zod';

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY!,
});

const createOrgSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  userId: z.string().min(1),
});

/** Create a Clerk organization and return its ID */
export const createOrganization = createServerFn({ method: 'POST' })
  .inputValidator(createOrgSchema)
  .handler(async ({ data }) => {
    const org = await clerkClient.organizations.createOrganization({
      name: data.name,
      slug: data.slug,
      createdBy: data.userId,
    });

    return org.id;
  });

/** Update the authenticated user's profile (name, image) */
export const updateAuthProfile = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      name: z.string().min(1),
      image: z.string().optional(),
    })
  )
  .handler(async ({ data }) => {
    const { userId } = await auth();
    if (!userId) throw new Error('Not authenticated');

    const names = data.name.split(' ');
    const result = await clerkClient.users.updateUser(userId, {
      firstName: names[0],
      lastName: names.slice(1).join(' ') || undefined,
      ...(data.image !== undefined && { imageUrl: data.image }),
    });
    return {
      id: result.id,
      firstName: result.firstName,
      lastName: result.lastName,
    };
  });

/** Delete the authenticated user's account */
export const deleteAccount = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      password: z.string().min(1),
    })
  )
  .handler(async ({ data }) => {
    const { userId } = await auth();
    if (!userId) throw new Error('Not authenticated');

    // Verify password before deletion
    const verified = await clerkClient.users.verifyPassword({
      userId,
      password: data.password,
    });

    if (!verified.verified) {
      throw new Error('Password is incorrect');
    }

    await clerkClient.users.deleteUser(userId);
  });
