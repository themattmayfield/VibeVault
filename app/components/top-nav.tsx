'use client';

import {
  Home,
  Menu,
  PlusCircle,
  Users,
  Activity,
  Settings,
  LogOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useState } from 'react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Link } from '@tanstack/react-router';

const routes = [
  {
    label: 'Dashboard',
    icon: Home,
    href: '/',
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

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src="/placeholder.svg?height=32&width=32"
                      alt="User"
                    />
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

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
