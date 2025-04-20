import { Home, Menu, PlusCircle, Users, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Link } from '@tanstack/react-router';
import { authClient } from '@/lib/auth-client';
import LogoutButton from './logout-button';
import LoginButton from './login-button';

const routes = [
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

export function TopNav() {
  const { data: session } = authClient.useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background">
        <div className="container flex h-16 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 font-semibold">
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                MB
              </div>
              <span className="hidden md:inline-block">Moodboard</span>
            </div>
          </div>

          {/* Desktop Navigation */}
          {session && (
            <nav className="hidden md:flex items-center gap-6">
              {routes.map((route) => (
                <Link
                  key={route.href}
                  to={route.href}
                  activeProps={{
                    className: 'text-primary',
                  }}
                  inactiveProps={{
                    className: 'text-muted-foreground',
                  }}
                >
                  <span className="flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary">
                    <route.icon className="h-4 w-4" />
                    {route.label}
                  </span>
                </Link>
              ))}
            </nav>
          )}

          <div className="flex items-center gap-2">
            {session ? <LogoutButton /> : <LoginButton />}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-[240px] sm:w-[300px]">
          <div className="flex items-center gap-2 font-semibold py-4">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
              MB
            </div>
            <span>Moodboard</span>
          </div>
          <nav className="flex flex-col gap-4 mt-4">
            {routes.map((route) => (
              <Link
                key={route.href}
                to={route.href}
                onClick={() => setMobileMenuOpen(false)}
                activeProps={{
                  className: 'bg-accent text-accent-foreground',
                }}
                inactiveProps={{
                  className: 'transparent',
                }}
              >
                <route.icon className="h-5 w-5" />
                <span>{route.label}</span>
              </Link>
            ))}
          </nav>
        </SheetContent>
      </Sheet>
    </>
  );
}
