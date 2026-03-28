import { getAuthUser } from '@/actions/getAuthUser';
import { LogMood } from '@/components/log-mood';
import { createFileRoute } from '@tanstack/react-router';
import { redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/new-log')({
  component: HomeRoute,
  beforeLoad: async () => {
    const user = await getAuthUser();
    if (user) {
      // Authenticated users should access their org's dashboard.
      // Since we don't know the slug here, redirect to root.
      throw redirect({ to: '/' });
    }
  },
});

function HomeRoute() {
  return (
    <>
      <div className=" px-2 sm:px-6 pt-12 sm:pt-24">
        <h1 className="text-3xl font-extrabold font-serif tracking-tight lg:text-5xl text-center mb-12">
          MoodSync
        </h1>
        <LogMood user={null} />
      </div>
    </>
  );
}
