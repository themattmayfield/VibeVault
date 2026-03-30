'use client';

import { useEffect, useState } from 'react';
import {
  Building2,
  CheckIcon,
  ChevronsUpDown,
  HelpCircleIcon,
  Plus,
  SearchIcon,
  SettingsIcon,
  User,
} from 'lucide-react';

import { NavJournals } from '@/components/nav-journals';
import { NavMain } from '@/components/nav-main';
import { NavSecondary } from '@/components/nav-secondary';
import { NavUser } from '@/components/nav-user';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Link,
  useParams,
  useRouter,
  useLoaderData,
} from '@tanstack/react-router';
import { getUserOrganizations } from '@/actions/organization';
import { useOrgSettings } from '@/hooks/use-org-settings';

type OrgMembership = {
  orgId: string;
  orgName: string | null;
  orgSlug: string | null;
  role: string;
};

const data = {
  navSecondary: (slug: string) => [
    {
      title: 'Settings',
      url: `/org/${slug}/settings`,
      icon: SettingsIcon,
    },
    {
      title: 'Get Help',
      url: '#',
      icon: HelpCircleIcon,
    },
    {
      title: 'Search',
      url: '#',
      icon: SearchIcon,
    },
  ],
};

function OrgIcon({ name }: { name: string | null }) {
  const isPersonal = name?.includes("'s Space");
  return isPersonal ? (
    <User className="h-4 w-4" />
  ) : (
    <Building2 className="h-4 w-4" />
  );
}

function OrgSwitcher() {
  const { slug } = useParams({ strict: false }) as { slug?: string };
  const router = useRouter();
  const [orgs, setOrgs] = useState<OrgMembership[]>([]);

  useEffect(() => {
    getUserOrganizations().then(setOrgs);
  }, []);

  const currentOrg = orgs.find((o) => o.orgSlug === slug);
  const currentName = currentOrg?.orgName ?? slug ?? 'Workspace';

  const handleSwitch = (orgSlug: string) => {
    if (orgSlug !== slug) {
      router.navigate({
        to: '/org/$slug/dashboard',
        params: { slug: orgSlug },
      });
    }
  };

  // If there's only one org (or none loaded yet), show a simple non-dropdown header
  if (orgs.length <= 1) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            size="lg"
            className="data-[slot=sidebar-menu-button]:!p-1.5"
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <OrgIcon name={currentOrg?.orgName ?? null} />
            </div>
            <span className="truncate text-sm font-semibold">
              {currentName}
            </span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[slot=sidebar-menu-button]:!p-1.5 cursor-pointer"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <OrgIcon name={currentOrg?.orgName ?? null} />
              </div>
              <span className="truncate text-sm font-semibold">
                {currentName}
              </span>
              <ChevronsUpDown className="ml-auto h-4 w-4 text-muted-foreground" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56"
            align="start"
            side="bottom"
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Workspaces
            </DropdownMenuLabel>
            {orgs.map(
              (org) =>
                org.orgSlug && (
                  <DropdownMenuItem
                    key={org.orgId}
                    onClick={() => handleSwitch(org.orgSlug!)}
                    className="cursor-pointer gap-2"
                  >
                    <div className="flex h-5 w-5 items-center justify-center rounded bg-primary/10 text-primary">
                      <OrgIcon name={org.orgName} />
                    </div>
                    <span className="truncate">
                      {org.orgName ?? org.orgSlug}
                    </span>
                    {org.orgSlug === slug && (
                      <CheckIcon className="ml-auto h-4 w-4 text-primary" />
                    )}
                  </DropdownMenuItem>
                )
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="cursor-pointer gap-2">
              <Link to="/get-started">
                <Plus className="h-4 w-4" />
                <span>Create workspace</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { slug } = useParams({ strict: false }) as { slug?: string };
  const { orgSettings } = useOrgSettings();

  // AppSidebar is always rendered within the _authenticated layout,
  // so we can safely access the authenticated user's loader data.
  const user = useLoaderData({
    from: '/org/$slug/_authenticated',
  });
  const userId = user?._id ?? null;

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <OrgSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavMain />
        {userId && orgSettings.clerkOrgId && (
          <NavJournals
            userId={userId}
            organizationId={orgSettings.clerkOrgId}
          />
        )}
        <NavSecondary
          items={data.navSecondary(slug ?? '')}
          className="mt-auto"
        />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
