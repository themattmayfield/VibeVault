import { getAuthUser } from '@/actions/getAuthUser';
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated')({
  component: RouteComponent,
  beforeLoad: async () => {
    const user = await getAuthUser();
    if (!user) {
      throw redirect({ to: '/sign-in' });
    }
  },
});

function RouteComponent() {
  return (
    <>
      <div className=" px-2 sm:px-6 pt-12">
        <Outlet />
      </div>
    </>
  );
}
