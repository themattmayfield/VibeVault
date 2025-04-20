import type { QueryClient } from '@tanstack/react-query';
import {
  createRootRouteWithContext,
  HeadContent,
} from '@tanstack/react-router';
import { Outlet } from '@tanstack/react-router';
import { Scripts } from '@tanstack/react-start';
import type * as React from 'react';
import { Toaster } from '@/components/ui/sonner';

import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import appCss from '@/styles/app.css?url';

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
      {
        rel: 'preconnect',
        href: 'https://fonts.googleapis.com',
      },
      {
        rel: 'preconnect',
        href: 'https://fonts.gstatic.com',
        crossOrigin: 'anonymous',
      },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=Nunito:ital,wght@0,200..1000;1,200..1000&family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap',
      },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap',
      },
    ],
  }),
  notFoundComponent: () => <div>Route not found</div>,
  component: RootComponent,
});

function RootComponent() {
  return (
    <RootDocument>
      <div className="flex min-h-screen flex-col ">
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
        <div className="texture" />
        {children}
        <TanStackRouterDevtools position="bottom-right" />
        <Scripts />
        <Toaster />
      </body>
    </html>
  );
}
