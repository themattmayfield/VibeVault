import { auth } from 'auth';
import { createServerFn } from '@tanstack/react-start';
import { getRequestHeaders } from '@tanstack/react-start/server';
import { z } from 'zod';

/** Server-side sign-out — runs on the same origin so the session cookie is accessible */
export const signOutAction = createServerFn({ method: 'POST' }).handler(
  async () => {
    const headers = getRequestHeaders();
    await auth.api.signOut({
      headers: headers as unknown as Headers,
    });
  }
);

const signInEmailSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const signUpEmailSchema = z.object({
  ...signInEmailSchema.shape,
  name: z.string().min(1),
});

export const signInEmail = createServerFn({ method: 'POST' })
  .inputValidator(signInEmailSchema)
  .handler(async ({ data }) => {
    const response = await auth.api.signInEmail({
      body: {
        email: data.email,
        password: data.password,
        rememberMe: true,
      },
    });

    return response.user.id;
  });

export const signUpEmail = createServerFn({ method: 'POST' })
  .inputValidator(signUpEmailSchema)
  .handler(async ({ data }) => {
    const response = await auth.api.signUpEmail({
      body: {
        name: data.name,
        email: data.email,
        password: data.password,
      },
    });

    return response.user.id;
  });

export const verifyEmail = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({ email: z.string().email(), callbackURL: z.string() })
  )
  .handler(async ({ data }) => {
    await auth.api.sendVerificationEmail({
      body: { email: data.email, callbackURL: data.callbackURL },
    });
  });

const createOrgSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  userId: z.string().min(1),
});

/** Create a Better Auth organization and return its ID */
export const createOrganization = createServerFn({ method: 'POST' })
  .inputValidator(createOrgSchema)
  .handler(async ({ data }) => {
    const org = await auth.api.createOrganization({
      body: {
        name: data.name,
        slug: data.slug,
        userId: data.userId,
      },
    });
    if (!org) {
      throw new Error('Failed to create organization');
    }
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
    const headers = getRequestHeaders();
    const result = await auth.api.updateUser({
      headers: headers as unknown as Headers,
      body: {
        name: data.name,
        ...(data.image !== undefined && { image: data.image }),
      },
    });
    return result;
  });

/** Change the authenticated user's password */
export const changePassword = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      currentPassword: z.string().min(1),
      newPassword: z.string().min(8),
    })
  )
  .handler(async ({ data }) => {
    const headers = getRequestHeaders();
    await auth.api.changePassword({
      headers: headers as unknown as Headers,
      body: {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      },
    });
  });

/** Change the authenticated user's email */
export const changeEmail = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      newEmail: z.string().email(),
    })
  )
  .handler(async ({ data }) => {
    const headers = getRequestHeaders();
    await auth.api.changeEmail({
      headers: headers as unknown as Headers,
      body: {
        newEmail: data.newEmail,
      },
    });
  });

/** Delete the authenticated user's account */
export const deleteAccount = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      password: z.string().min(1),
    })
  )
  .handler(async ({ data }) => {
    const headers = getRequestHeaders();
    await auth.api.deleteUser({
      headers: headers as unknown as Headers,
      body: {
        password: data.password,
      },
    });
  });

/** List active sessions for the authenticated user */
export const listSessions = createServerFn({ method: 'GET' }).handler(
  async () => {
    const headers = getRequestHeaders();
    const sessions = await auth.api.listSessions({
      headers: headers as unknown as Headers,
    });
    return sessions;
  }
);

/** Revoke a specific session */
export const revokeSession = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ sessionToken: z.string() }))
  .handler(async ({ data }) => {
    const headers = getRequestHeaders();
    await auth.api.revokeSession({
      headers: headers as unknown as Headers,
      body: { token: data.sessionToken },
    });
  });
