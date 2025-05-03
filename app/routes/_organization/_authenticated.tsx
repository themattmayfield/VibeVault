import { getAuthUser } from '@/actions/getAuthUser';
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { api } from 'convex/_generated/api';
import { convexQuery } from '@convex-dev/react-query';

export const Route = createFileRoute('/_organization/_authenticated')({
  component: RouteComponent,
  loader: async ({ context }) => {
    const authUser = await getAuthUser();
    console.log('MADE IT HERE');
    console.log('authUser', authUser);
    console.log('and here');

    if (!authUser) {
      throw redirect({ to: '/sign-in' });
    }
    console.log('MADE IT HERE 2');
    const user = await context.queryClient.fetchQuery(
      convexQuery(api.user.getUserFromNeonUserId, {
        neonUserId: authUser?.id ?? '',
      })
    );
    console.log('MADE IT HERE 3');

    if (!user) {
      throw redirect({ to: '/sign-in' });
    }
    console.log('MADE IT HERE 4');

    return user;
  },
});

function RouteComponent() {
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
