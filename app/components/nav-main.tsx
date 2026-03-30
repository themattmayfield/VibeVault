import { PlusCircleIcon } from 'lucide-react';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Link, useLocation, useParams } from '@tanstack/react-router';
import { getRoutes } from '@/constants/routes';
import { useContext } from 'react';
import { OrgSettingsContext } from '@/hooks/use-org-settings';

export function NavMain() {
  const { slug } = useParams({ strict: false }) as { slug?: string };
  const routes = getRoutes(slug ?? '');
  const location = useLocation();

  // Read context directly (returns null outside provider instead of throwing)
  const orgSettings = useContext(OrgSettingsContext);
  const featureFlags = orgSettings?.featureFlags as
    | Record<string, boolean | undefined>
    | undefined;

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-2">
            <Link
              to="/org/$slug/log"
              params={{ slug: slug ?? '' }}
              className="w-full"
            >
              <SidebarMenuButton
                tooltip="Log Mood"
                className="min-w-8 bg-primary text-primary-foreground duration-200 ease-linear hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground cursor-pointer"
              >
                <PlusCircleIcon />
                <span>Log Mood</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMenu>
          {routes.map((item) => {
            if (item.ignoreInSidebar) return null;

            // Check feature flag gating
            if (
              item.featureFlag &&
              featureFlags &&
              featureFlags[item.featureFlag] === false
            ) {
              return null;
            }

            return (
              <SidebarMenuItem key={item.label}>
                <Link to={item.href as string} key={item.label}>
                  <SidebarMenuButton
                    tooltip={item.label}
                    className="cursor-pointer"
                    isActive={location.pathname.startsWith(item.href)}
                  >
                    {item.icon && <item.icon />}
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
