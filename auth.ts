import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { tanstackStartCookies } from 'better-auth/tanstack-start';
import { organization } from 'better-auth/plugins';
import { db } from './drizzle';
import { schema } from './auth-schema';
import { polar, checkout, webhooks, portal } from '@polar-sh/better-auth';
import { Polar } from '@polar-sh/sdk';
import { Resend } from 'resend';

if (!process.env.POLAR_ACCESS_TOKEN) {
  throw new Error('POLAR_ACCESS_TOKEN is not set');
}

if (!process.env.POLAR_WEBHOOK_SECRET) {
  throw new Error('POLAR_WEBHOOK_SECRET is not set');
}

export const polarClient = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN,
  server: 'sandbox',
});
const resend = new Resend(process.env.RESEND_API_KEY);

const isProduction = process.env.NODE_ENV === 'production';

export const auth = betterAuth({
  emailAndPassword: {
    requireEmailVerification: false,
    enabled: true,
    autoSignIn: true,
  },
  emailVerification: {
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      await resend.emails.send({
        from: 'mail@agapemedia.co',
        to: user.email,
        subject: 'Email Verification',
        html: `Click the link to verify your email: ${url}`,
      });
    },
  },
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: schema,
  }),

  advanced: {
    defaultCookieAttributes: {
      secure: isProduction,
      httpOnly: true,
      sameSite: 'lax',
    },
  },

  plugins: [
    organization(),
    polar({
      client: polarClient,
      createCustomerOnSignUp: true,
      use: [
        checkout({
          products: [
            {
              productId: '07d39ccf-11d5-4993-bb36-c5892f49d252',
              slug: 'pro',
            },
          ],
        }),
        portal(),
        webhooks({
          secret: process.env.POLAR_WEBHOOK_SECRET!,
          onPayload: async (_payload) => {
            // TODO: handle polar webhook events (subscription created, etc.)
          },
        }),
      ],
    }),
    tanstackStartCookies(),
  ],
});
