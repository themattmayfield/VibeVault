import { getAuthUser } from '@/actions/getAuthUser';
import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/org/$slug/')({
  beforeLoad: async ({ params }) => {
    const user = await getAuthUser();
    if (user) {
      throw redirect({
        to: '/org/$slug/dashboard',
        params: { slug: params.slug },
      });
    }
    throw redirect({
      to: '/org/$slug/sign-in',
      params: { slug: params.slug },
    });
  },
});
