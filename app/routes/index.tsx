import { LogMood } from '@/components/log-mood';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: HomeRoute,
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
