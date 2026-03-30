import { resolvePlanFromProductId } from '@/lib/polar-products';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../convex/_generated/api';

// Convex HTTP client for calling mutations from webhook handlers
const convexUrl = process.env.VITE_CONVEX_URL;
const convex = convexUrl ? new ConvexHttpClient(convexUrl) : null;

/**
 * Handle a validated Polar webhook payload.
 * Called from the /api/polar/webhook route after signature verification.
 */
export async function handlePolarWebhook(payload: unknown) {
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
    const clerkOrgId = metadata.clerkOrgId as string | undefined;

    if (!productId) {
      console.warn('[Polar Webhook] No product ID in subscription event');
      return;
    }

    const resolved = resolvePlanFromProductId(productId);
    if (!resolved) {
      console.warn(`[Polar Webhook] Unknown product ID: ${productId}`);
      return;
    }

    // Extract seat count for seat-based subscriptions (Team plan)
    const seatCount =
      typeof subscription?.seats === 'number' ? subscription.seats : undefined;

    console.log(
      `[Polar Webhook] Subscription ${type}: plan=${resolved.plan}, orgId=${clerkOrgId ?? 'unknown'}, seats=${seatCount ?? 'N/A'}`
    );

    if (clerkOrgId) {
      try {
        await convex.mutation(api.organization.updateOrgPlan, {
          clerkOrgId,
          plan: resolved.plan,
          polarSubscriptionId: subscription.id,
          polarCustomerId: subscription.customer_id,
          ...(seatCount !== undefined && { seatCount }),
        });
        console.log(
          `[Polar Webhook] Updated org plan to ${resolved.plan}${seatCount ? ` (${seatCount} seats)` : ''}`
        );
      } catch (err) {
        console.error('[Polar Webhook] Failed to update org plan:', err);
      }
    }
  }

  if (type === 'subscription.canceled' || type === 'subscription.revoked') {
    const subscription = event.data;
    const metadata = subscription?.metadata ?? {};
    const clerkOrgId = metadata.clerkOrgId as string | undefined;

    console.log(
      `[Polar Webhook] Subscription ${type}: orgId=${clerkOrgId ?? 'unknown'}`
    );

    if (clerkOrgId) {
      try {
        await convex.mutation(api.organization.updateOrgPlan, {
          clerkOrgId,
          plan: 'free',
          polarSubscriptionId: subscription.id,
          polarCustomerId: subscription.customer_id,
        });
        console.log('[Polar Webhook] Downgraded org plan to free');
      } catch (err) {
        console.error('[Polar Webhook] Failed to downgrade org plan:', err);
      }
    }
  }
}
