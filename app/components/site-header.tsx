import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Link, useMatchRoute, useRouterState } from '@tanstack/react-router';
import { ROUTES } from '@/constants/routes';

export function SiteHeader() {
  const location = useRouterState({ select: (s) => s.location });

  const matchRoute = useMatchRoute();

  const params = matchRoute({ to: '/groups/$groupId' });
  const groupId = params ? params.groupId : null;

  const activeRoute = groupId
    ? 'Group'
    : ROUTES.find((r) => r.href === location.pathname)?.label;

  return (
    <header className="group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 flex h-12 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1 cursor-pointer" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium flex-1">{activeRoute}</h1>
        <Link to="/log" activeProps={{ className: 'hidden' }}>
          <Button size="sm" className="cursor-pointer">
            Log Mood
          </Button>
        </Link>
      </div>
    </header>
  );
}
