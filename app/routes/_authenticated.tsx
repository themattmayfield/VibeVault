import { TopNav } from '@/components/top-nav';
import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated')({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div>
      <TopNav />
      <div className=" px-2 sm:px-6 pt-12">
        <Outlet />
      </div>
    </div>
  );
}
