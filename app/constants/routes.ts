import { PlusCircle } from 'lucide-react';

import { Users, Activity, LayoutDashboardIcon } from 'lucide-react';

export const ROUTES = [
  {
    label: 'Dashboard',
    icon: LayoutDashboardIcon,
    href: '/o/$orgId/dashboard',
    ignoreInSidebar: false,
  },
  {
    label: 'Log Your Mood',
    icon: PlusCircle,
    href: '/o/$orgId/log',
    ignoreInSidebar: true,
  },
  {
    label: 'Groups',
    icon: Users,
    href: '/o/$orgId/groups',
    ignoreInSidebar: false,
  },
  {
    label: 'Global Trends',
    icon: Activity,
    href: '/o/$orgId/trends',
    ignoreInSidebar: false,
  },
] as const;
