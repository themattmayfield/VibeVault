import { useEffect, useRef } from 'react';
import { getAuthUser } from '@/actions/getAuthUser';
import { getClerkUserEmail } from '@/actions/auth';
import { checkOrgMembership } from '@/actions/organization';
import {
  createFileRoute,
  Outlet,
  redirect,
  useLoaderData,
  Link,
} from '@tanstack/react-router';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { api } from 'convex/_generated/api';
import { convexQuery } from '@convex-dev/react-query';
import { useMutation } from 'convex/react';
import { useOrgSettings } from '@/hooks/use-org-settings';
import { Info } from 'lucide-react';

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

    // Verify the authenticated user is a member of THIS organization.
    // Fetch orgSettings (cached by queryClient from parent loader) to get clerkOrgId.
    const orgSettings = await context.queryClient.fetchQuery(
      convexQuery(api.organization.getOrgSettingsBySlug, {
        slug: context.slug,
      })
    );

    if (orgSettings?.clerkOrgId) {
      const membership = await checkOrgMembership({
        data: { organizationId: orgSettings.clerkOrgId },
      });

      if (!membership.isMember) {
        throw redirect({
          to: '/org/$slug/not-a-member',
          params: { slug: context.slug },
        });
      }
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
  const { slug } = Route.useParams();
  const data = useLoaderData({ from: '/org/$slug/_authenticated' });
  const { _clerkEmail, ...user } = data;
  const syncEmail = useMutation(api.user.syncUserEmail);
  const hasSynced = useRef(false);
  const { orgSettings } = useOrgSettings();

  // Self-healing: backfill email from Clerk if missing on the Convex doc.
  // The email was fetched server-side from the Clerk Backend API in the loader.
  useEffect(() => {
    if (!user.email && _clerkEmail && !hasSynced.current) {
      hasSynced.current = true;
      void syncEmail({ email: _clerkEmail });
    }
  }, [user.email, _clerkEmail, syncEmail]);

  const showSeatBanner =
    orgSettings.plan === 'team' &&
    typeof orgSettings.seatCount === 'number' &&
    orgSettings.seatCount > 0;

  return (
    <SidebarProvider className="bg-sidebar">
      <AppSidebar variant="inset" />
      <SidebarInset className="border">
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            {showSeatBanner && (
              <div className="mx-4 mt-4 md:mx-6 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
                <Info className="h-4 w-4 flex-shrink-0" />
                <span>
                  Your Team plan includes{' '}
                  <strong>{orgSettings.seatCount}</strong> seats.{' '}
                  <Link
                    to="/org/$slug/settings"
                    params={{ slug }}
                    search={{ tab: 'billing' }}
                    className="underline underline-offset-2 hover:text-amber-900 dark:hover:text-amber-100"
                  >
                    Manage seats in billing settings
                  </Link>
                </span>
              </div>
            )}
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <Outlet />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
