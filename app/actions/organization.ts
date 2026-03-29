import { createServerFn } from '@tanstack/react-start';
import { auth } from '@clerk/tanstack-react-start/server';
import { createClerkClient } from '@clerk/backend';
import { z } from 'zod';

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY!,
});

/** Set the active organization on the user's session based on org ID */
export const setActiveOrganization = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ organizationId: z.string() }))
  .handler(async ({ data }) => {
    // With Clerk, the active organization is set client-side via
    // useOrganizationList().setActive() or <OrganizationSwitcher />.
    // This server function is a no-op kept for compatibility.
    return { organizationId: data.organizationId };
  });

/** Get the full organization details including members */
export const getFullOrganization = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ organizationId: z.string() }))
  .handler(async ({ data }) => {
    const org = await clerkClient.organizations.getOrganization({
      organizationId: data.organizationId,
    });

    const memberships =
      await clerkClient.organizations.getOrganizationMembershipList({
        organizationId: data.organizationId,
      });

    return {
      id: org.id,
      name: org.name,
      slug: org.slug,
      imageUrl: org.imageUrl,
      createdAt: org.createdAt,
      members: memberships.data.map((m) => ({
        id: m.id,
        userId: m.publicUserData?.userId ?? '',
        role: m.role,
        user: {
          name: `${m.publicUserData?.firstName ?? ''} ${m.publicUserData?.lastName ?? ''}`.trim(),
          email: m.publicUserData?.identifier ?? '',
          image: m.publicUserData?.imageUrl ?? null,
        },
      })),
    };
  });

/** Get the current user's role in an organization */
export const getOrgMemberRole = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ organizationId: z.string() }))
  .handler(async ({ data }) => {
    const { userId } = await auth();
    if (!userId) return null;

    const memberships =
      await clerkClient.organizations.getOrganizationMembershipList({
        organizationId: data.organizationId,
      });

    const membership = memberships.data.find(
      (m) => m.publicUserData?.userId === userId
    );

    const rawRole = membership?.role ?? null;
    if (rawRole === 'org:admin') return 'owner';
    if (rawRole === 'org:member') return 'member';
    return rawRole;
  });

/** Update organization name/slug/logo */
export const updateOrganization = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      organizationId: z.string(),
      name: z.string().min(1).optional(),
      slug: z.string().min(1).optional(),
      logo: z.string().optional(),
    })
  )
  .handler(async ({ data }) => {
    const result = await clerkClient.organizations.updateOrganization(
      data.organizationId,
      {
        name: data.name,
        slug: data.slug,
      }
    );

    return {
      id: result.id,
      name: result.name,
      slug: result.slug,
    };
  });

/** Invite a member to the organization */
export const inviteMember = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      organizationId: z.string(),
      email: z.string().email(),
      role: z.enum(['member', 'owner']),
    })
  )
  .handler(async ({ data }) => {
    // Map 'owner' to 'org:admin' for Clerk's role system
    const clerkRole =
      data.role === 'owner' ? 'org:admin' : (`org:${data.role}` as string);

    const result = await clerkClient.organizations.createOrganizationInvitation(
      {
        organizationId: data.organizationId,
        emailAddress: data.email,
        role: clerkRole,
        inviterUserId: (await auth()).userId!,
      }
    );

    return {
      id: result.id,
      emailAddress: result.emailAddress,
      role: result.role,
    };
  });

/** Remove a member from the organization */
export const removeMember = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      organizationId: z.string(),
      memberIdOrEmail: z.string(),
    })
  )
  .handler(async ({ data }) => {
    // Clerk uses userId to remove members
    await clerkClient.organizations.deleteOrganizationMembership({
      organizationId: data.organizationId,
      userId: data.memberIdOrEmail,
    });
  });

/** Update a member's role */
export const updateMemberRole = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      organizationId: z.string(),
      memberId: z.string(),
      role: z.enum(['member', 'owner']),
    })
  )
  .handler(async ({ data }) => {
    const clerkRole =
      data.role === 'owner' ? 'org:admin' : (`org:${data.role}` as string);

    await clerkClient.organizations.updateOrganizationMembership({
      organizationId: data.organizationId,
      userId: data.memberId,
      role: clerkRole,
    });
  });

/** Check if a slug is available for a new organization */
export const checkSlugAvailable = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ slug: z.string().min(3).max(63) }))
  .handler(async ({ data }) => {
    const normalized = data.slug.toLowerCase();

    try {
      // Try to get an org with this slug -- if it exists, slug is taken
      await clerkClient.organizations.getOrganization({
        slug: normalized,
      });
      return false; // Org exists, slug is taken
    } catch {
      return true; // Org not found, slug is available
    }
  });

/** Get all organizations the authenticated user belongs to (with slugs) */
export const getUserOrganizations = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { userId } = await auth();
    if (!userId) return [];

    const memberships = await clerkClient.users.getOrganizationMembershipList({
      userId,
    });

    return memberships.data.map((m) => ({
      orgId: m.organization.id,
      orgName: m.organization.name,
      orgSlug: m.organization.slug,
      role: m.role,
    }));
  }
);

/** Add a user as a member of an organization */
export const addMemberToOrganization = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      userId: z.string(),
      organizationId: z.string(),
      role: z.enum(['member', 'admin', 'owner']).default('member'),
    })
  )
  .handler(async ({ data }) => {
    const clerkRole =
      data.role === 'owner'
        ? 'org:admin'
        : data.role === 'admin'
          ? 'org:admin'
          : 'org:member';

    const result = await clerkClient.organizations.createOrganizationMembership(
      {
        organizationId: data.organizationId,
        userId: data.userId,
        role: clerkRole,
      }
    );

    return {
      id: result.id,
      role: result.role,
    };
  });
