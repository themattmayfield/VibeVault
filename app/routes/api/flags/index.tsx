/**
 * Flags discovery endpoint for the Vercel Flags Explorer.
 *
 * The Vercel Toolbar calls /.well-known/vercel/flags to discover flag
 * definitions. Since TanStack Start can't define routes outside /app/routes,
 * we create the handler here and rewrite to it via vercel.json.
 *
 * Rewrite: /.well-known/vercel/flags -> /api/flags
 */
import { createFileRoute } from '@tanstack/react-router';
import { verifyAccess, type ApiData } from '@vercel/flags';
import { FLAG_DEFAULTS } from '@/lib/flags';

export const Route = createFileRoute('/api/flags/')({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        const access = await verifyAccess(request.headers.get('Authorization'));
        if (!access) {
          return new Response(JSON.stringify(null), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        // Build definitions from the flag registry
        const definitions: Record<
          string,
          {
            description?: string;
            origin?: string;
            options?: { value: unknown; label: string }[];
          }
        > = {};

        for (const [key, defaultValue] of Object.entries(FLAG_DEFAULTS)) {
          if (typeof defaultValue === 'boolean') {
            definitions[key] = {
              options: [
                { value: false, label: 'Off' },
                { value: true, label: 'On' },
              ],
            };
          }
        }

        const apiData: ApiData = { definitions };

        return new Response(JSON.stringify(apiData), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      },
    },
  },
});
