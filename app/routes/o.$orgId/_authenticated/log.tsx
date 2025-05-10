import { createFileRoute, useLoaderData } from '@tanstack/react-router';
import { LogMood } from '@/components/log-mood';

export const Route = createFileRoute('/o/$orgId/_authenticated/log')({
  component: RouteComponent,
});

function RouteComponent() {
  const user = useLoaderData({
    from: '/o/$orgId/_authenticated',
  });
  return (
    <div className="px-4">
      <LogMood user={user} />
    </div>
  );
}
