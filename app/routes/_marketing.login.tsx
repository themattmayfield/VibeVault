import {
  createFileRoute,
  Link,
  redirect,
  useRouter,
} from '@tanstack/react-router';
import { useState } from 'react';
import {
  GalleryVerticalEnd,
  Building2,
  User,
  ArrowLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { APP_INFO } from '@/constants/app-info';
import { signInEmail } from '@/actions/auth';
import { getUserOrganizations } from '@/actions/organization';
import { useSubmittingDots } from '@/hooks/useSubmittingDots';
import { getAuthUser } from '@/actions/getAuthUser';

type OrgMembership = {
  orgId: string;
  orgName: string | null;
  orgSlug: string | null;
  role: string;
};

export const Route = createFileRoute('/_marketing/login')({
  component: LoginPage,
  beforeLoad: async () => {
    // If already authenticated, redirect for single-org users.
    // Multi-org users fall through to the component to see the org picker.
    const user = await getAuthUser();
    if (user) {
      const orgs = await getUserOrganizations();
      if (orgs.length === 1 && orgs[0].orgSlug) {
        throw redirect({
          to: '/org/$slug/dashboard',
          params: { slug: orgs[0].orgSlug },
        });
      }
      // Multi-org or zero-org: let the component render
      // (multi-org shows picker, zero-org shows the login form)
    }
  },
});

function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orgs, setOrgs] = useState<OrgMembership[] | null>(null);
  const dots = useSubmittingDots(isSubmitting);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error('Please enter your email and password');
      return;
    }

    setIsSubmitting(true);

    try {
      await signInEmail({ data: { email, password } });

      // After sign-in, get the user's org memberships
      const userOrgs = await getUserOrganizations();

      if (userOrgs.length === 0) {
        toast.error('No organization found for this account');
        setIsSubmitting(false);
        return;
      }

      if (userOrgs.length === 1 && userOrgs[0].orgSlug) {
        // Single org -- redirect directly
        router.navigate({
          to: '/org/$slug/dashboard',
          params: { slug: userOrgs[0].orgSlug },
        });
      } else {
        // Multiple orgs -- show the picker
        setOrgs(userOrgs);
        setIsSubmitting(false);
      }
    } catch (error) {
      setIsSubmitting(false);
      const message =
        error instanceof Error ? error.message : 'Invalid email or password';
      toast.error(message);
    }
  };

  const handleOrgSelect = (slug: string) => {
    router.navigate({
      to: '/org/$slug/dashboard',
      params: { slug },
    });
  };

  // Org picker view -- shown after login when user has multiple orgs
  if (orgs) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
        <div className="flex w-full max-w-md flex-col gap-6">
          <Link
            to="/"
            className="flex items-center gap-2 self-center font-medium"
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <GalleryVerticalEnd className="size-4" />
            </div>
            {APP_INFO.name}
          </Link>
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-xl">Choose a workspace</CardTitle>
              <CardDescription>
                Select which workspace you&apos;d like to open
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                {orgs.map((org) =>
                  org.orgSlug ? (
                    <button
                      key={org.orgId}
                      type="button"
                      onClick={() => handleOrgSelect(org.orgSlug!)}
                      className="flex items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-accent hover:text-accent-foreground cursor-pointer"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                        {org.orgName?.includes("'s Space") ? (
                          <User className="h-4 w-4" />
                        ) : (
                          <Building2 className="h-4 w-4" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {org.orgName ?? org.orgSlug}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {APP_INFO.domain}/org/{org.orgSlug}
                          <span className="ml-2 capitalize">{org.role}</span>
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    </button>
                  ) : null
                )}
              </div>
            </CardContent>
          </Card>
          <button
            type="button"
            onClick={() => setOrgs(null)}
            className="flex items-center gap-1 self-center text-sm text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <ArrowLeft className="h-3 w-3" />
            Sign in with a different account
          </button>
        </div>
      </div>
    );
  }

  // Login form view
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Link
          to="/"
          className="flex items-center gap-2 self-center font-medium"
        >
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <GalleryVerticalEnd className="size-4" />
          </div>
          {APP_INFO.name}
        </Link>
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Welcome back</CardTitle>
            <CardDescription>
              Sign in to your {APP_INFO.name} account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full cursor-pointer"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? `Signing in${dots}` : 'Sign in'}
                </Button>
              </div>
            </form>
            <div className="mt-4 text-center text-sm">
              Don&apos;t have an account?{' '}
              <Link to="/get-started" className="underline underline-offset-4">
                Get started
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
