import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/temp-redirect')({
  component: RouteComponent,
  beforeLoad: async ({ search }) => {
    const { subdomain } = search;
    console.log('subdomain', subdomain);

    throw redirect({
      href: `https://${subdomain}.localhost:3000/admin`,
    });
  },
});

function RouteComponent() {
  return <div>Hello "/temp-redirect"!</div>;
}
