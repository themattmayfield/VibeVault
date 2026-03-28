import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/_marketing')({
  component: RouteComponent,
  // No subdomain check needed here -- the URL rewrite in router.tsx
  // handles routing subdomain requests to /tenant/* routes automatically.
  // Marketing routes only match when there's no subdomain (no /tenant prefix).
});

function RouteComponent() {
  return <Outlet />;
}
