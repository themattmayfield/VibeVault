import { getAuthUser } from '@/actions/getAuthUser';
import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/tenant/')({
  beforeLoad: async () => {
    const user = await getAuthUser();
    if (user) {
      throw redirect({ to: '/tenant/dashboard' });
    }
    throw redirect({ to: '/tenant/sign-in' });
  },
});
