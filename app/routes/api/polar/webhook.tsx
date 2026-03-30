/**
 * Polar webhook endpoint.
 *
 * Receives POST requests from Polar when subscription events occur
 * (created, active, updated, canceled, revoked). Validates the webhook
 * signature using the Polar SDK and delegates to the handler.
 */
import { createFileRoute } from '@tanstack/react-router';
import {
  validateEvent,
  WebhookVerificationError,
} from '@polar-sh/sdk/webhooks';
import { handlePolarWebhook } from '@/actions/polar-webhook';

export const Route = createFileRoute('/api/polar/webhook')({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const webhookSecret = process.env.POLAR_WEBHOOK_SECRET;
        if (!webhookSecret) {
          console.error(
            '[Polar Webhook] POLAR_WEBHOOK_SECRET is not configured'
          );
          return new Response(
            JSON.stringify({ error: 'Webhook secret not configured' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
          );
        }

        try {
          const body = await request.text();
          const headers: Record<string, string> = {};
          request.headers.forEach((value, key) => {
            headers[key] = value;
          });

          // Validate the webhook signature and parse the event
          const event = validateEvent(body, headers, webhookSecret);

          // Delegate to the handler
          await handlePolarWebhook(event);

          return new Response(JSON.stringify({ received: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        } catch (error) {
          if (error instanceof WebhookVerificationError) {
            console.error(
              '[Polar Webhook] Signature verification failed:',
              error.message
            );
            return new Response(
              JSON.stringify({ error: 'Invalid webhook signature' }),
              { status: 403, headers: { 'Content-Type': 'application/json' } }
            );
          }

          console.error('[Polar Webhook] Handler error:', error);
          return new Response(
            JSON.stringify({ error: 'Internal server error' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
          );
        }
      },
    },
  },
});
