import { polarClient } from 'auth';
import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';

const createPolarCheckoutSessionSchema = z.object({
  country: z.literal('US'),
  product: z.literal('07d39ccf-11d5-4993-bb36-c5892f49d252'),
  successUrl: z.string().min(1),
  customerEmail: z.string().email(),
  customerName: z.string().min(1),
});

export const createPolarCheckoutSession = createServerFn({ method: 'POST' })
  .validator(createPolarCheckoutSessionSchema)
  .handler(async ({ data }) => {
    const response = await polarClient.checkouts.create({
      customerBillingAddress: {
        country: 'US',
        // city: 'Atlanta',
        // state: 'GA',
        // postalCode: '30331',
        // line1: '2666 county line rd.',
      },
      products: [data.product],
      successUrl: data.successUrl,
      customerEmail: data.customerEmail,
      customerName: data.customerName,
    });

    return response;
  });

export const getPolarCheckoutSession = createServerFn({ method: 'GET' })
  .validator(z.object({ checkoutId: z.string() }))
  .handler(async ({ data }) => {
    const response = await polarClient.checkouts.get({ id: data.checkoutId });
    return response;
  });

export const getPolarCustomer = createServerFn({ method: 'GET' })
  .validator(z.object({ customerId: z.string() }))
  .handler(async ({ data }) => {
    const response = await polarClient.customers.get({ id: data.customerId });
    return response;
  });
