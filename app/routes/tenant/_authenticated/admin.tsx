import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/tenant/_authenticated/admin')({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Admin Dashboard</div>;
}
