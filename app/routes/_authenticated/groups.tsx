import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated/groups')({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/_authRoutes/groupts"!</div>;
}
