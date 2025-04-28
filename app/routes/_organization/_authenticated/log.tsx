import { createFileRoute, useLoaderData } from '@tanstack/react-router';
import { LogMood } from '@/components/log-mood';

export const Route = createFileRoute('/_organization/_authenticated/log')({
  component: RouteComponent,
});

function RouteComponent() {
  const user = useLoaderData({
    from: '/_organization/_authenticated',
  });
  return (
    <div className="px-4">
      <LogMood user={user} />
    </div>
  );
}
