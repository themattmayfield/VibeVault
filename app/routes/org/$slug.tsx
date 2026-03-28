import { createFileRoute, Outlet, notFound } from '@tanstack/react-router';
import { convexQuery } from '@convex-dev/react-query';
import { api } from 'convex/_generated/api';
import { APP_INFO } from '@/constants/app-info';
import { Button } from '@/components/ui/button';
import { Link } from '@tanstack/react-router';

export const Route = createFileRoute('/org/$slug')({
  component: RouteComponent,
  beforeLoad: async ({ params }) => {
    return { slug: params.slug };
  },
  loader: async ({ context, params }) => {
    // Resolve the org settings from the URL slug
    const orgSettings = await context.queryClient.fetchQuery(
      convexQuery(api.organization.getOrgSettingsBySlug, {
        slug: params.slug,
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
  const { slug } = Route.useRouteContext();

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex max-w-md flex-col items-center gap-4 text-center">
        <div className="text-6xl">?</div>
        <h1 className="text-2xl font-bold tracking-tight">
          Organization not found
        </h1>
        <p className="text-muted-foreground">
          The organization{' '}
          <span className="font-medium text-foreground">
            {APP_INFO.domain}/org/{slug}
          </span>{' '}
          doesn't exist or has been removed.
        </p>
        <p className="text-sm text-muted-foreground">
          Double-check the URL, or head back to {APP_INFO.name} to get started.
        </p>
        <div className="flex gap-3 pt-2">
          <Button asChild>
            <Link to="/">Go to {APP_INFO.name}</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/join">Create an organization</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function RouteComponent() {
  return <Outlet />;
}
