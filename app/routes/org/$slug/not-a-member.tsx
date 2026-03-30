import { createFileRoute, Link, useParams } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { ShieldX } from 'lucide-react';
import { APP_INFO } from '@/constants/app-info';
import { useOrgSettings } from '@/hooks/use-org-settings';

export const Route = createFileRoute('/org/$slug/not-a-member')({
  component: NotAMemberPage,
});

function NotAMemberPage() {
  const { slug } = useParams({ strict: false }) as { slug: string };
  const { orgSettings } = useOrgSettings();

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex max-w-md flex-col items-center gap-4 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <ShieldX className="h-7 w-7 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">
          You're not a member
        </h1>
        <p className="text-muted-foreground">
          You don't have access to{' '}
          <span className="font-medium text-foreground">
            {APP_INFO.domain}/org/{slug}
          </span>
          . Ask an organization admin to send you an invitation.
        </p>
        {orgSettings.openSignup && (
          <p className="text-sm text-muted-foreground">
            This organization allows open sign-up.{' '}
            <Link
              to="/org/$slug/sign-up"
              params={{ slug }}
              className="underline underline-offset-4 hover:text-foreground"
            >
              Create an account to join.
            </Link>
          </p>
        )}
        <div className="flex gap-3 pt-2">
          <Button asChild>
            <Link to="/">Go to {APP_INFO.name}</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/join">Your organizations</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
