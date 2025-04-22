import { getAuthUser } from '@/actions/getAuthUser';
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

export const Route = createFileRoute('/_authenticated')({
  component: RouteComponent,
  loader: async () => {
    const user = await getAuthUser();
    if (!user) {
      throw redirect({ to: '/sign-in' });
    }

    return { user };
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
