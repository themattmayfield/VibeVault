import { createFileRoute, useLoaderData } from '@tanstack/react-router';
import { LogMood } from '@/components/log-mood';

export const Route = createFileRoute('/tenant/_authenticated/log')({
  component: RouteComponent,
});

function RouteComponent() {
  const user = useLoaderData({
    from: '/tenant/_authenticated',
  });
  const { orgSettings } = useLoaderData({
    from: '/tenant',
  });
  return (
    <div className="px-4">
      <LogMood user={user} organizationId={orgSettings.betterAuthOrgId} />
    </div>
  );
}
