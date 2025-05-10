import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_organization/_authenticated/o/$orgId/admin')({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/_organization/_authenticated/welcome"!</div>;
}
