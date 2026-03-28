import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { tanstackStartCookies } from 'better-auth/tanstack-start';
import { organization } from 'better-auth/plugins';
import { db } from './drizzle';
import { schema } from './auth-schema';
import { polar, checkout, webhooks, portal } from '@polar-sh/better-auth';
import { Polar } from '@polar-sh/sdk';
import { Resend } from 'resend';
import { getCookieDomain, isSecure, getAppDomain } from './app/lib/domain';

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

const cookieDomain = getCookieDomain(); // e.g. ".moodsync.localhost" or ".moodsync.com"
const appDomain = getAppDomain(); // e.g. "moodsync.localhost" or "moodsync.com"
const secure = isSecure();

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
    crossSubDomainCookies: {
      enabled: true,
      domain: cookieDomain,
    },
    defaultCookieAttributes: {
      secure,
      httpOnly: true,
      sameSite: 'lax', // 'lax' works for same-site subdomains (safer than 'none')
      domain: cookieDomain,
    },
  },

  // Dynamically trust any origin on our app domain (all tenant subdomains)
  trustedOrigins: (req) => {
    const origin = req?.headers.get('origin');

    if (!origin) {
      return [`${secure ? 'https' : 'http'}://${appDomain}`];
    }

    try {
      const originUrl = new URL(origin);
      const hostname = originUrl.hostname;

      // Trust the root domain and any subdomain of the app domain
      if (hostname === appDomain || hostname.endsWith(`.${appDomain}`)) {
        return [origin];
      }

      // Also trust plain localhost for dev tooling
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return [origin];
      }

      return [];
    } catch {
      return [];
    }
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
