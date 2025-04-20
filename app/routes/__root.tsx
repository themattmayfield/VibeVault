import type { QueryClient } from '@tanstack/react-query';
import {
  createRootRouteWithContext,
  HeadContent,
} from '@tanstack/react-router';
import { Outlet } from '@tanstack/react-router';
import { Scripts } from '@tanstack/react-start';
import type * as React from 'react';
import { Toaster } from '@/components/ui/sonner';

import appCss from '@/styles/app.css?url';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { TopNav } from '@/components/top-nav';

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
}>()({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'TanStack Start Starter',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),
  notFoundComponent: () => <div>Route not found</div>,
  component: RootComponent,
});

function RootComponent() {
  return (
    <RootDocument>
      <div className="flex min-h-screen flex-col">
        <TopNav />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </RootDocument>
  );
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <TanStackRouterDevtools position="bottom-right" />
        <Scripts />
        <Toaster />
      </body>
    </html>
  );
}
