import { useEffect, useRef } from 'react';
import { getAuthUser } from '@/actions/getAuthUser';
import { getClerkUserEmail } from '@/actions/auth';
import {
  createFileRoute,
  Outlet,
  redirect,
  useLoaderData,
} from '@tanstack/react-router';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { api } from 'convex/_generated/api';
import { convexQuery } from '@convex-dev/react-query';
import { useMutation } from 'convex/react';

export const Route = createFileRoute('/org/$slug/_authenticated')({
  component: RouteComponent,
  loader: async ({ context }) => {
    const authUser = await getAuthUser();

    if (!authUser) {
      throw redirect({
        to: '/org/$slug/sign-in',
        params: { slug: context.slug },
      });
    }

    const user = await context.queryClient.fetchQuery(
      convexQuery(api.user.getUserByClerkId, {
        clerkUserId: authUser?.id ?? '',
      })
    );

    if (!user) {
      throw redirect({
        to: '/org/$slug/sign-in',
        params: { slug: context.slug },
      });
    }

    // If the user is missing an email, fetch it server-side from Clerk.
    // Pass it to the component so it can fire the sync mutation client-side.
    let clerkEmail: string | null = null;
    if (!user.email) {
      clerkEmail = await getClerkUserEmail();
    }

    return { ...user, _clerkEmail: clerkEmail };
  },
});

function RouteComponent() {
  const data = useLoaderData({ from: '/org/$slug/_authenticated' });
  const { _clerkEmail, ...user } = data;
  const syncEmail = useMutation(api.user.syncUserEmail);
  const hasSynced = useRef(false);

  // Self-healing: backfill email from Clerk if missing on the Convex doc.
  // The email was fetched server-side from the Clerk Backend API in the loader.
  useEffect(() => {
    if (!user.email && _clerkEmail && !hasSynced.current) {
      hasSynced.current = true;
      void syncEmail({ email: _clerkEmail });
    }
  }, [user.email, _clerkEmail, syncEmail]);

  return (
    <SidebarProvider className="bg-sidebar">
      <AppSidebar variant="inset" />
      <SidebarInset className="border">
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <Outlet />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
