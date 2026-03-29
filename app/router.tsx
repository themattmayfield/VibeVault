import { createRouter as createTanStackRouter } from '@tanstack/react-router';
import { QueryClient } from '@tanstack/react-query';
import { routerWithQueryClient } from '@tanstack/react-router-with-query';
import { ConvexQueryClient } from '@convex-dev/react-query';
import { ConvexProvider } from 'convex/react';
import { routeTree } from './routeTree.gen';
import type { RootRouteContext } from './routes/__root';

// Export the convexQueryClient so __root.tsx can access the underlying ConvexReactClient
// for use with ConvexProviderWithClerk inside the route tree.
let _convexQueryClient: ConvexQueryClient;
export function getConvexQueryClient() {
  return _convexQueryClient;
}

export function getRouter() {
  const CONVEX_URL = import.meta.env.VITE_CONVEX_URL;
  if (!CONVEX_URL) {
    console.error('missing envar VITE_CONVEX_URL');
  }
  _convexQueryClient = new ConvexQueryClient(CONVEX_URL);

  const queryClient: QueryClient = new QueryClient({
    defaultOptions: {
      queries: {
        queryKeyHashFn: _convexQueryClient.hashFn(),
        queryFn: _convexQueryClient.queryFn(),
      },
    },
  });
  _convexQueryClient.connect(queryClient);

  const router = routerWithQueryClient(
    createTanStackRouter({
      routeTree,
      defaultPreload: 'intent',
      context: { queryClient } satisfies RootRouteContext,
      scrollRestoration: true,
      scrollRestorationBehavior: 'smooth',
      defaultHashScrollIntoView: {
        behavior: 'smooth',
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
