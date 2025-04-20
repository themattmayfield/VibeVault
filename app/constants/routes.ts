import { Home, PlusCircle, Users, Activity } from 'lucide-react';

export const routes = [
  {
    label: 'Dashboard',
    icon: Home,
    href: '/dashboard',
  },
  {
    label: 'Log Mood',
    icon: PlusCircle,
    href: '/log',
  },
  {
    label: 'Groups',
    icon: Users,
    href: '/groups',
  },
  {
    label: 'Global Trends',
    icon: Activity,
    href: '/trends',
  },
];
