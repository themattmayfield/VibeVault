import { createFileRoute, useLoaderData } from '@tanstack/react-router';
import { LogMood } from '@/components/log-mood';

export const Route = createFileRoute('/org/$slug/_authenticated/log')({
  component: RouteComponent,
});

function RouteComponent() {
  const user = useLoaderData({
    from: '/org/$slug/_authenticated',
  });
  const { orgSettings } = useLoaderData({
    from: '/org/$slug',
  });
  return (
    <div className="px-4">
      <LogMood user={user} organizationId={orgSettings.clerkOrgId} />
    </div>
  );
}
