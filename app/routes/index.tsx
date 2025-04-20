import { getAuthUser } from '@/actions/getAuthUser';
import { LogMood } from '@/components/log-mood';
import { createFileRoute } from '@tanstack/react-router';
import { redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: HomeRoute,
  beforeLoad: async () => {
    const user = await getAuthUser();
    if (user) {
      throw redirect({ to: '/log' });
    }
  },
});

function HomeRoute() {
  return (
    <>
      <div className=" px-2 sm:px-6 pt-12">
        <LogMood />
      </div>
    </>
  );
}
