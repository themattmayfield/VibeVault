import { auth } from 'auth';
import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';

const signInEmailSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const signUpEmailSchema = z.object({
  ...signInEmailSchema.shape,
  name: z.string().min(1),
});

export const signInEmail = createServerFn({ method: 'POST' })
  .validator(signInEmailSchema)
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
  .validator(signUpEmailSchema)
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
  .validator(z.object({ email: z.string().email(), callbackURL: z.string() }))
  .handler(async ({ data }) => {
    await auth.api.sendVerificationEmail({
      body: { email: data.email, callbackURL: data.callbackURL },
    });
  });
