import { PlusCircle } from 'lucide-react';

import { Users, Activity, LayoutDashboardIcon } from 'lucide-react';

export const ROUTES = [
  {
    label: 'Dashboard',
    icon: LayoutDashboardIcon,
    href: '/dashboard',
    ignoreInSidebar: false,
  },
  {
    label: 'Log Your Mood',
    icon: PlusCircle,
    href: '/log',
    ignoreInSidebar: true,
  },
  {
    label: 'Groups',
    icon: Users,
    href: '/groups',
    ignoreInSidebar: false,
  },
  {
    label: 'Global Trends',
    icon: Activity,
    href: '/trends',
    ignoreInSidebar: false,
  },
] as const;
