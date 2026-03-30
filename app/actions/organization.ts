import { createServerFn } from '@tanstack/react-start';
import { auth } from '@clerk/tanstack-react-start/server';
import { createClerkClient } from '@clerk/backend';
import { z } from 'zod';

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY!,
});

/**
 * Verify the caller is authenticated and has org:admin role in the given org.
 * Returns the caller's userId on success, throws on failure.
 */
async function requireOrgAdmin(organizationId: string): Promise<string> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error('Authentication required');
  }

  const memberships =
    await clerkClient.organizations.getOrganizationMembershipList({
      organizationId,
    });

  const membership = memberships.data.find(
    (m) => m.publicUserData?.userId === userId
  );

  if (!membership || membership.role !== 'org:admin') {
    throw new Error('Only organization owners can perform this action');
  }

  return userId;
}

/**
 * Verify the caller is authenticated and is a member (any role) of the given org.
 * Returns the caller's userId and role on success, throws on failure.
 */
async function requireOrgMember(
  organizationId: string
): Promise<{ userId: string; role: string }> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error('Authentication required');
  }

  const memberships =
    await clerkClient.organizations.getOrganizationMembershipList({
      organizationId,
    });

  const membership = memberships.data.find(
    (m) => m.publicUserData?.userId === userId
  );

  if (!membership) {
    throw new Error('You are not a member of this organization');
  }

  const rawRole = membership.role;
  const role = rawRole === 'org:admin' ? 'owner' : 'member';

  return { userId, role };
}

/**
 * Check if the authenticated caller is a member of the given org.
 * Returns { isMember, role } without throwing -- designed for route loaders
 * that need to make redirect decisions.
 */
export const checkOrgMembership = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ organizationId: z.string() }))
  .handler(async ({ data }) => {
    const { userId } = await auth();
    if (!userId) return { isMember: false, role: null };

    const memberships =
      await clerkClient.organizations.getOrganizationMembershipList({
        organizationId: data.organizationId,
      });

    const membership = memberships.data.find(
      (m) => m.publicUserData?.userId === userId
    );

    if (!membership) return { isMember: false, role: null };

    const rawRole = membership.role;
    const role = rawRole === 'org:admin' ? 'owner' : 'member';
    return { isMember: true, role };
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

/** Get the full organization details including members (requires membership) */
export const getFullOrganization = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ organizationId: z.string() }))
  .handler(async ({ data }) => {
    await requireOrgMember(data.organizationId);

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
        role: m.role === 'org:admin' ? 'owner' : 'member',
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

/** Update organization name/slug/logo (requires org admin) */
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
    await requireOrgAdmin(data.organizationId);

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
      slug: z.string(),
    })
  )
  .handler(async ({ data }) => {
    const userId = await requireOrgAdmin(data.organizationId);

    const clerkRole =
      data.role === 'owner' ? 'org:admin' : (`org:${data.role}` as string);

    const domain = process.env.VITE_APP_DOMAIN || 'sentio.sh';
    const redirectUrl = `https://${domain}/org/${data.slug}/dashboard`;

    const result = await clerkClient.organizations.createOrganizationInvitation(
      {
        organizationId: data.organizationId,
        emailAddress: data.email,
        role: clerkRole,
        inviterUserId: userId,
        redirectUrl,
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
    const callerId = await requireOrgAdmin(data.organizationId);

    if (data.memberIdOrEmail === callerId) {
      throw new Error('Cannot remove yourself from the organization');
    }

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
    await requireOrgAdmin(data.organizationId);

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

/**
 * Add a user as a member of an organization.
 *
 * Authorization rules:
 * - Self-join (caller === userId being added): only allowed when the org has
 *   openSignup enabled. Role is always 'member' for self-joins.
 * - Admin-add (caller is an org:admin): allowed regardless of openSignup.
 *   Role can be 'member' or 'admin'.
 */
export const addMemberToOrganization = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      userId: z.string(),
      organizationId: z.string(),
      role: z.enum(['member', 'admin', 'owner']).default('member'),
    })
  )
  .handler(async ({ data }) => {
    const { userId: callerId } = await auth();
    if (!callerId) {
      throw new Error('Authentication required');
    }

    const isSelfJoin = callerId === data.userId;

    if (isSelfJoin) {
      // Self-join: check if the org allows open sign-up
      const convexUrl = process.env.VITE_CONVEX_URL;
      if (!convexUrl) throw new Error('Convex URL not configured');

      const { ConvexHttpClient } = await import('convex/browser');
      const { api } = await import('../../convex/_generated/api');
      const convex = new ConvexHttpClient(convexUrl);

      const orgSettings = await convex.query(
        api.organization.getOrgSettingsByClerkOrgId,
        { clerkOrgId: data.organizationId }
      );

      if (!orgSettings?.openSignup) {
        throw new Error(
          'This organization requires an invitation to join. Contact an admin for access.'
        );
      }

      // Self-join is always as a regular member -- ignore any role escalation
      const result =
        await clerkClient.organizations.createOrganizationMembership({
          organizationId: data.organizationId,
          userId: data.userId,
          role: 'org:member',
        });

      return { id: result.id, role: result.role };
    }

    // Admin-initiated add: verify the caller is an org admin
    await requireOrgAdmin(data.organizationId);

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
