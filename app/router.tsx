import { createRouter as createTanStackRouter } from '@tanstack/react-router';
import { QueryClient } from '@tanstack/react-query';
import { routerWithQueryClient } from '@tanstack/react-router-with-query';
import { ConvexQueryClient } from '@convex-dev/react-query';
import { ConvexProvider } from 'convex/react';
import { routeTree } from './routeTree.gen';
import type { RootRouteContext } from './routes/__root';
import { getAppDomain } from './lib/domain';

export function getRouter() {
  const CONVEX_URL = import.meta.env.VITE_CONVEX_URL;
  if (!CONVEX_URL) {
    console.error('missing envar VITE_CONVEX_URL');
  }
  const convexQueryClient = new ConvexQueryClient(CONVEX_URL);

  const queryClient: QueryClient = new QueryClient({
    defaultOptions: {
      queries: {
        queryKeyHashFn: convexQueryClient.hashFn(),
        queryFn: convexQueryClient.queryFn(),
      },
    },
  });
  convexQueryClient.connect(queryClient);

  const appDomain = getAppDomain();

  const router = routerWithQueryClient(
    createTanStackRouter({
      routeTree,
      defaultPreload: 'intent',
      context: { queryClient, subdomain: null } satisfies RootRouteContext,
      Wrap: ({ children }) => (
        <ConvexProvider client={convexQueryClient.convexClient}>
          {children}
        </ConvexProvider>
      ),
      scrollRestoration: true,
      scrollRestorationBehavior: 'smooth',
      defaultHashScrollIntoView: {
        behavior: 'smooth',
      },
      rewrite: {
        input: ({ url }) => {
          const hostname = url.hostname;

          // If hostname is a subdomain of appDomain, prefix path with /tenant
          // e.g. acme.moodsync.localhost/dashboard -> /tenant/dashboard
          if (hostname !== appDomain && hostname.endsWith(`.${appDomain}`)) {
            url.pathname = `/tenant${url.pathname}`;
          }
          return url;
        },
        output: ({ url }) => {
          // Strip /tenant prefix for browser display
          // e.g. /tenant/dashboard -> /dashboard (subdomain carries the context)
          if (url.pathname.startsWith('/tenant')) {
            url.pathname = url.pathname.replace(/^\/tenant/, '') || '/';
          }
          return url;
        },
      },
    }),
    queryClient
  );

  return router;
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
