import { createServerFn } from '@tanstack/react-start';
import { getRequestHeaders } from '@tanstack/react-start/server';
import { auth } from 'auth';
import { z } from 'zod';
import { db } from '../../drizzle';
import { organization } from '../../auth-schema';
import { eq } from 'drizzle-orm';

/** Set the active organization on the user's session based on org ID */
export const setActiveOrganization = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ organizationId: z.string() }))
  .handler(async ({ data }) => {
    const headers = getRequestHeaders();
    if (!headers) return null;

    const result = await auth.api.setActiveOrganization({
      headers: headers as unknown as Headers,
      body: { organizationId: data.organizationId },
    });

    return result;
  });

/** Get the full organization details including members */
export const getFullOrganization = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ organizationId: z.string() }))
  .handler(async ({ data }) => {
    const headers = getRequestHeaders();
    if (!headers) return null;

    const result = await auth.api.getFullOrganization({
      headers: headers as unknown as Headers,
      query: { organizationId: data.organizationId },
    });

    return result;
  });

/** Get the current user's role in an organization */
export const getOrgMemberRole = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ organizationId: z.string() }))
  .handler(async ({ data }) => {
    const headers = getRequestHeaders();
    if (!headers) return null;

    const session = await auth.api.getSession({
      headers: headers as unknown as Headers,
    });
    if (!session) return null;

    const org = await auth.api.getFullOrganization({
      headers: headers as unknown as Headers,
      query: { organizationId: data.organizationId },
    });

    if (!org) return null;

    const member = org.members.find(
      (m: { userId: string }) => m.userId === session.user.id
    );
    return member?.role ?? null;
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
    const headers = getRequestHeaders();
    if (!headers) return null;

    const body: Record<string, string> = {};
    if (data.name) body.name = data.name;
    if (data.slug) body.slug = data.slug;
    if (data.logo) body.logo = data.logo;

    const result = await auth.api.updateOrganization({
      headers: headers as unknown as Headers,
      body: {
        organizationId: data.organizationId,
        data: body,
      },
    });

    return result;
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
    const headers = getRequestHeaders();
    if (!headers) return null;

    const result = await auth.api.createInvitation({
      headers: headers as unknown as Headers,
      body: {
        organizationId: data.organizationId,
        email: data.email,
        role: data.role,
      },
    });

    return result;
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
    const headers = getRequestHeaders();
    if (!headers) return null;

    await auth.api.removeMember({
      headers: headers as unknown as Headers,
      body: {
        organizationId: data.organizationId,
        memberIdOrEmail: data.memberIdOrEmail,
      },
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
    const headers = getRequestHeaders();
    if (!headers) return null;

    await auth.api.updateMemberRole({
      headers: headers as unknown as Headers,
      body: {
        organizationId: data.organizationId,
        memberId: data.memberId,
        role: data.role,
      },
    });
  });

/** Check if a subdomain/slug is available for a new organization */
export const checkSubdomainAvailable = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ subdomain: z.string().min(3).max(63) }))
  .handler(async ({ data }) => {
    const slug = data.subdomain.toLowerCase();

    // Check if the slug is already taken in the Neon organization table
    const existing = await db
      .select({ id: organization.id })
      .from(organization)
      .where(eq(organization.slug, slug))
      .limit(1);

    return existing.length === 0;
  });

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
    const headers = getRequestHeaders();
    if (!headers) return null;

    const result = await auth.api.addMember({
      headers: headers as unknown as Headers,
      body: {
        userId: data.userId,
        organizationId: data.organizationId,
        role: data.role,
      },
    });

    return result;
  });
