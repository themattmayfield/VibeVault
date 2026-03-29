/// <reference types="vite/client" />
import type { QueryClient } from '@tanstack/react-query';
import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
  Scripts,
} from '@tanstack/react-router';
import type * as React from 'react';
import { Toaster } from '@/components/ui/sonner';
import { ClerkProvider, useAuth } from '@clerk/tanstack-react-start';
import { ConvexProviderWithClerk } from 'convex/react-clerk';
import { getConvexQueryClient } from '@/router';

import { TanStackDevtools } from '@tanstack/react-devtools';
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools';
import { PlanSwitcherPanel } from '@/components/dev-plan-switcher';
import { RoleSwitcherPanel } from '@/components/dev-role-switcher';
import appCss from '@/styles/app.css?url';
import { APP_INFO } from '@/constants/app-info';

export interface RootRouteContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RootRouteContext>()({
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
        title: APP_INFO.name,
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
    ],
  }),
  notFoundComponent: () => <div>Route not found</div>,
  component: RootComponent,
  shellComponent: RootDocument,
});

function RootComponent() {
  const convexClient = getConvexQueryClient().convexClient;

  return (
    <ClerkProvider signInUrl="/login" signUpUrl="/signup">
      <ConvexProviderWithClerk client={convexClient} useAuth={useAuth}>
        <div className="flex min-h-screen flex-col">
          <main className="flex-1 overflow-y-auto">
            <Outlet />
          </main>
        </div>
      </ConvexProviderWithClerk>
    </ClerkProvider>
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
        <TanStackDevtools
          plugins={[
            {
              name: 'Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
            {
              name: 'Plan Switcher',
              render: <PlanSwitcherPanel />,
            },
            {
              name: 'Role Switcher',
              render: <RoleSwitcherPanel />,
            },
          ]}
        />
        <Scripts />
        <Toaster />
      </body>
    </html>
  );
}
