import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { tanstackStartCookies } from 'better-auth/tanstack-start';
import { organization } from 'better-auth/plugins';
import { db } from './drizzle';
import { schema } from './auth-schema';
import { polar, checkout, webhooks, portal } from '@polar-sh/better-auth';
import { Polar } from '@polar-sh/sdk';
import { Resend } from 'resend';
import { resolvePlanFromProductId } from '@/lib/polar-products';
import { ConvexHttpClient } from 'convex/browser';
import { api } from './convex/_generated/api';

if (!process.env.POLAR_ACCESS_TOKEN) {
  throw new Error('POLAR_ACCESS_TOKEN is not set');
}

if (!process.env.POLAR_WEBHOOK_SECRET) {
  throw new Error('POLAR_WEBHOOK_SECRET is not set');
}

if (!process.env.POLAR_SERVER) {
  throw new Error(
    'POLAR_SERVER is not set (expected "sandbox" or "production")'
  );
}

export const polarClient = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN,
  server: process.env.POLAR_SERVER as 'sandbox' | 'production',
});
const resend = new Resend(process.env.RESEND_API_KEY);

const isProduction = process.env.NODE_ENV === 'production';

// Convex HTTP client for calling mutations from webhook handlers
const convexUrl = process.env.VITE_CONVEX_URL;
const convex = convexUrl ? new ConvexHttpClient(convexUrl) : null;

// Build the checkout products array from all tier product IDs
const checkoutProducts: Array<{ productId: string; slug: string }> = [];
if (process.env.POLAR_PRO_MONTHLY_ID)
  checkoutProducts.push({
    productId: process.env.POLAR_PRO_MONTHLY_ID,
    slug: 'pro-monthly',
  });
if (process.env.POLAR_PRO_ANNUAL_ID)
  checkoutProducts.push({
    productId: process.env.POLAR_PRO_ANNUAL_ID,
    slug: 'pro-annual',
  });
if (process.env.POLAR_TEAM_MONTHLY_ID)
  checkoutProducts.push({
    productId: process.env.POLAR_TEAM_MONTHLY_ID,
    slug: 'team-monthly',
  });
if (process.env.POLAR_TEAM_ANNUAL_ID)
  checkoutProducts.push({
    productId: process.env.POLAR_TEAM_ANNUAL_ID,
    slug: 'team-annual',
  });
if (process.env.POLAR_ENTERPRISE_MONTHLY_ID)
  checkoutProducts.push({
    productId: process.env.POLAR_ENTERPRISE_MONTHLY_ID,
    slug: 'enterprise-monthly',
  });
if (process.env.POLAR_ENTERPRISE_ANNUAL_ID)
  checkoutProducts.push({
    productId: process.env.POLAR_ENTERPRISE_ANNUAL_ID,
    slug: 'enterprise-annual',
  });

// Fallback to legacy single product ID if new env vars aren't set
if (checkoutProducts.length === 0 && process.env.POLAR_PRODUCT_ID) {
  checkoutProducts.push({
    productId: process.env.POLAR_PRODUCT_ID,
    slug: 'pro',
  });
}

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
          products: checkoutProducts,
        }),
        portal(),
        webhooks({
          secret: process.env.POLAR_WEBHOOK_SECRET!,
          onPayload: async (payload) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const event = payload as any;
            const type = event.type as string;

            console.log(`[Polar Webhook] Received event: ${type}`);

            if (!convex) {
              console.warn(
                '[Polar Webhook] Convex client not initialized (VITE_CONVEX_URL missing)'
              );
              return;
            }

            // Handle subscription lifecycle events
            if (
              type === 'subscription.created' ||
              type === 'subscription.active' ||
              type === 'subscription.updated'
            ) {
              const subscription = event.data;
              const productId = subscription?.product?.id;
              const metadata = subscription?.metadata ?? {};
              const betterAuthOrgId = metadata.betterAuthOrgId as
                | string
                | undefined;

              if (!productId) {
                console.warn(
                  '[Polar Webhook] No product ID in subscription event'
                );
                return;
              }

              const resolved = resolvePlanFromProductId(productId);
              if (!resolved) {
                console.warn(
                  `[Polar Webhook] Unknown product ID: ${productId}`
                );
                return;
              }

              console.log(
                `[Polar Webhook] Subscription ${type}: plan=${resolved.plan}, orgId=${betterAuthOrgId ?? 'unknown'}`
              );

              if (betterAuthOrgId) {
                try {
                  await convex.mutation(api.organization.updateOrgPlan, {
                    betterAuthOrgId,
                    plan: resolved.plan,
                    polarSubscriptionId: subscription.id,
                    polarCustomerId: subscription.customer_id,
                  });
                  console.log(
                    `[Polar Webhook] Updated org plan to ${resolved.plan}`
                  );
                } catch (err) {
                  console.error(
                    '[Polar Webhook] Failed to update org plan:',
                    err
                  );
                }
              }
            }

            if (
              type === 'subscription.canceled' ||
              type === 'subscription.revoked'
            ) {
              const subscription = event.data;
              const metadata = subscription?.metadata ?? {};
              const betterAuthOrgId = metadata.betterAuthOrgId as
                | string
                | undefined;

              console.log(
                `[Polar Webhook] Subscription ${type}: orgId=${betterAuthOrgId ?? 'unknown'}`
              );

              if (betterAuthOrgId) {
                try {
                  await convex.mutation(api.organization.updateOrgPlan, {
                    betterAuthOrgId,
                    plan: 'free',
                    polarSubscriptionId: subscription.id,
                    polarCustomerId: subscription.customer_id,
                  });
                  console.log('[Polar Webhook] Downgraded org plan to free');
                } catch (err) {
                  console.error(
                    '[Polar Webhook] Failed to downgrade org plan:',
                    err
                  );
                }
              }
            }
          },
        }),
      ],
    }),
    tanstackStartCookies(),
  ],
});
