import { createFileRoute, Link } from '@tanstack/react-router';
import {
  ArrowLeft,
  ArrowRight,
  User,
  Building2,
  Sparkles,
  BarChart3,
  Calendar,
  Users,
  ShieldCheck,
  HeadphonesIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { APP_INFO } from '@/constants/app-info';

export const Route = createFileRoute('/_marketing/get-started')({
  component: GetStartedPage,
});

function GetStartedPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-3xl flex-col gap-8">
        <div className="flex flex-col items-center gap-4">
          <Link to="/" className="flex items-center gap-2 font-medium">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
              {APP_INFO.name.charAt(0)}
            </div>
            <span className="font-bold text-xl">{APP_INFO.name}</span>
          </Link>
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight">
              How will you use {APP_INFO.name}?
            </h1>
            <p className="mt-2 text-muted-foreground">
              Choose the path that fits you best. You can always upgrade later.
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Personal card */}
          <Card className="relative flex flex-col transition-all hover:border-primary/50 hover:shadow-md">
            <CardHeader>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <User className="h-6 w-6" />
              </div>
              <CardTitle className="text-xl">For Myself</CardTitle>
              <CardDescription>
                Track your mood, spot patterns, and get personal insights.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Sparkles className="h-4 w-4 text-primary flex-shrink-0" />
                  <span>AI-powered mood insights</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <BarChart3 className="h-4 w-4 text-primary flex-shrink-0" />
                  <span>Personal trends and analytics</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-primary flex-shrink-0" />
                  <span>Mood calendar and streaks</span>
                </div>
              </div>
              <div className="mt-4 inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                Free to start
              </div>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full">
                <Link to="/signup">
                  Get started free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>

          {/* Organization card */}
          <Card className="relative flex flex-col transition-all hover:border-primary/50 hover:shadow-md">
            <CardHeader>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Building2 className="h-6 w-6" />
              </div>
              <CardTitle className="text-xl">For My Organization</CardTitle>
              <CardDescription>
                Monitor and support emotional wellbeing across your team or
                institution.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-primary flex-shrink-0" />
                  <span>Team analytics and group management</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <ShieldCheck className="h-4 w-4 text-primary flex-shrink-0" />
                  <span>Admin dashboard and role controls</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <HeadphonesIcon className="h-4 w-4 text-primary flex-shrink-0" />
                  <span>Priority support and onboarding</span>
                </div>
              </div>
              <div className="mt-4 inline-flex items-center rounded-full bg-muted-foreground/10 px-3 py-1 text-xs font-medium text-muted-foreground">
                14-day free trial
              </div>
            </CardContent>
            <CardFooter>
              <Button asChild variant="outline" className="w-full">
                <Link to="/join">
                  Set up organization
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
          <p>
            Already have an account?{' '}
            <Link
              to="/login"
              className="underline underline-offset-4 hover:text-foreground"
            >
              Sign in
            </Link>
          </p>
          <Link
            to="/"
            className="flex items-center gap-1 hover:text-foreground"
          >
            <ArrowLeft className="h-3 w-3" />
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
