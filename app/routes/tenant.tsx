import {
  createFileRoute,
  Outlet,
  notFound,
  redirect,
} from '@tanstack/react-router';
import { convexQuery } from '@convex-dev/react-query';
import { api } from 'convex/_generated/api';
import { APP_INFO } from '@/constants/app-info';
import { buildRootUrl } from '@/lib/domain';
import { Button } from '@/components/ui/button';

export const Route = createFileRoute('/tenant')({
  component: RouteComponent,
  beforeLoad: async ({ context }) => {
    // Tenant routes require a subdomain
    if (!context.subdomain) {
      throw redirect({ to: '/' });
    }
    return { subdomain: context.subdomain };
  },
  loader: async ({ context }) => {
    if (!context.subdomain) throw redirect({ to: '/' });

    // Resolve the org settings from the subdomain
    const orgSettings = await context.queryClient.fetchQuery(
      convexQuery(api.organization.getOrgSettingsBySubdomain, {
        subdomain: context.subdomain,
      })
    );

    if (!orgSettings) {
      throw notFound();
    }

    return { orgSettings };
  },
  notFoundComponent: OrgNotFound,
});

function OrgNotFound() {
  const { subdomain } = Route.useRouteContext();
  const rootUrl = buildRootUrl();

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex max-w-md flex-col items-center gap-4 text-center">
        <div className="text-6xl">?</div>
        <h1 className="text-2xl font-bold tracking-tight">
          Organization not found
        </h1>
        <p className="text-muted-foreground">
          The organization at{' '}
          <span className="font-medium text-foreground">
            {subdomain}.{APP_INFO.domain}
          </span>{' '}
          doesn't exist or has been removed.
        </p>
        <p className="text-sm text-muted-foreground">
          Double-check the URL, or head back to {APP_INFO.name} to get started.
        </p>
        <div className="flex gap-3 pt-2">
          <Button asChild>
            <a href={rootUrl}>Go to {APP_INFO.name}</a>
          </Button>
          <Button variant="outline" asChild>
            <a href={`${rootUrl}/join`}>Create an organization</a>
          </Button>
        </div>
      </div>
    </div>
  );
}

function RouteComponent() {
  return <Outlet />;
}
