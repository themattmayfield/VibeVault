import { PlusCircle } from 'lucide-react';

import {
  Users,
  Activity,
  LayoutDashboardIcon,
  CalendarDays,
  Lightbulb,
} from 'lucide-react';

export const ROUTES = [
  {
    label: 'Dashboard',
    icon: LayoutDashboardIcon,
    href: '/tenant/dashboard',
    ignoreInSidebar: false,
  },
  {
    label: 'Log Your Mood',
    icon: PlusCircle,
    href: '/tenant/log',
    ignoreInSidebar: true,
  },
  {
    label: 'Calendar',
    icon: CalendarDays,
    href: '/tenant/calendar',
    ignoreInSidebar: false,
  },
  {
    label: 'Insights',
    icon: Lightbulb,
    href: '/tenant/insights',
    ignoreInSidebar: false,
  },
  {
    label: 'Groups',
    icon: Users,
    href: '/tenant/groups',
    ignoreInSidebar: false,
  },
  {
    label: 'Global Trends',
    icon: Activity,
    href: '/tenant/trends',
    ignoreInSidebar: false,
  },
] as const;
