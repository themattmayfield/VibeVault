import { PlusCircle } from 'lucide-react';

import {
  Users,
  Activity,
  LayoutDashboardIcon,
  CalendarDays,
  Lightbulb,
} from 'lucide-react';

export const getRoutes = (slug: string) =>
  [
    {
      label: 'Dashboard',
      icon: LayoutDashboardIcon,
      href: `/org/${slug}/dashboard`,
      ignoreInSidebar: false,
    },
    {
      label: 'Log Your Mood',
      icon: PlusCircle,
      href: `/org/${slug}/log`,
      ignoreInSidebar: true,
    },
    {
      label: 'Calendar',
      icon: CalendarDays,
      href: `/org/${slug}/calendar`,
      ignoreInSidebar: false,
    },
    {
      label: 'Insights',
      icon: Lightbulb,
      href: `/org/${slug}/insights`,
      ignoreInSidebar: false,
    },
    {
      label: 'Groups',
      icon: Users,
      href: `/org/${slug}/groups`,
      ignoreInSidebar: false,
    },
    {
      label: 'Global Trends',
      icon: Activity,
      href: `/org/${slug}/trends`,
      ignoreInSidebar: false,
    },
  ] as const;
