import { getSubdomainAction } from '@/actions/subdomain';
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/_organization')({
  component: RouteComponent,
  loader: async () => {
    const subdomain = await getSubdomainAction();

    if (!subdomain) {
      throw redirect({
        to: '/',
      });
    }
    return { subdomain };
  },
});

function RouteComponent() {
  return <Outlet />;
}
