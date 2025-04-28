import { getSubdomainAction } from '@/actions/subdomain';
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/_public')({
  component: RouteComponent,
  beforeLoad: async () => {
    const subdomain = await getSubdomainAction();

    if (subdomain) {
      throw redirect({
        to: '/sign-in',
      });
    }
  },
});

function RouteComponent() {
  return <Outlet />;
}
