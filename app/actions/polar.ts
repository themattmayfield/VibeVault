import { polarClient } from '@/lib/polar';
import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { PLAN_PRODUCT_MAP } from '@/lib/polar-products';

// Re-export for convenience
export {
  PLAN_PRODUCT_MAP,
  PRODUCT_PLAN_MAP,
  resolvePlanFromProductId,
} from '@/lib/polar-products';

// ---------------------------------------------------------------------------
// Server functions
// ---------------------------------------------------------------------------

const createPolarCheckoutSessionSchema = z.object({
  country: z.literal('US'),
  plan: z.enum(['pro', 'team', 'enterprise']),
  billingCycle: z.enum(['annual', 'monthly']),
  successUrl: z.string().min(1),
  customerEmail: z.string().email(),
  customerName: z.string().min(1),
  seats: z
    .number()
    .min(1)
    .max(100)
    .optional()
    .describe('Number of seats (for seat-based Team plan only)'),
  metadata: z
    .record(z.string(), z.string())
    .optional()
    .describe(
      'Additional metadata to attach to the checkout (e.g. clerkOrgId)'
    ),
});

export const createPolarCheckoutSession = createServerFn({ method: 'POST' })
  .inputValidator(createPolarCheckoutSessionSchema)
  .handler(async ({ data }) => {
    const productId = PLAN_PRODUCT_MAP[data.plan]?.[data.billingCycle];
    if (!productId) {
      throw new Error(
        `No Polar product configured for plan="${data.plan}" billingCycle="${data.billingCycle}"`
      );
    }

    const response = await polarClient.checkouts.create({
      customerBillingAddress: {
        country: 'US',
      },
      products: [productId],
      successUrl: data.successUrl,
      customerEmail: data.customerEmail,
      customerName: data.customerName,
      ...(data.seats !== undefined && { seats: data.seats }),
      metadata: {
        plan: data.plan,
        billingCycle: data.billingCycle,
        ...(data.metadata ?? {}),
      },
    });

    return response;
  });

export const getPolarCheckoutSession = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ checkoutId: z.string() }))
  .handler(async ({ data }) => {
    const response = await polarClient.checkouts.get({ id: data.checkoutId });
    return response;
  });

export const getPolarCustomer = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ customerId: z.string() }))
  .handler(async ({ data }) => {
    const response = await polarClient.customers.get({ id: data.customerId });
    return response;
  });

/** Get the Polar customer portal URL for the authenticated user */
export const getCustomerPortalUrl = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { auth } = await import('@clerk/tanstack-react-start/server');
    const { userId } = await auth();

    if (!userId) {
      throw new Error('Not authenticated');
    }

    // Use the Polar SDK to create a customer session directly
    try {
      const customerSession = await polarClient.customerSessions.create({
        externalCustomerId: userId,
      });
      return customerSession.customerPortalUrl;
    } catch {
      return null;
    }
  }
);
