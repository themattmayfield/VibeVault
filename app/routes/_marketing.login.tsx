import {
  createFileRoute,
  Link,
  redirect,
  useRouter,
} from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
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
import { useAuth, useSignIn } from '@clerk/tanstack-react-start';
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
  const { isSignedIn } = useAuth();
  const { signIn } = useSignIn();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orgs, setOrgs] = useState<OrgMembership[] | null>(null);
  const dots = useSubmittingDots(isSubmitting);
  const ssoHandled = useRef(false);

  /** Shared post-sign-in: fetch orgs, auto-redirect or show picker */
  const handlePostSignIn = async () => {
    await new Promise((resolve) => setTimeout(resolve, 500));

    const userOrgs = await getUserOrganizations();

    if (userOrgs.length === 0) {
      toast.error('No organization found for this account');
      setIsSubmitting(false);
      return;
    }

    if (userOrgs.length === 1 && userOrgs[0].orgSlug) {
      router.navigate({
        to: '/org/$slug/dashboard',
        params: { slug: userOrgs[0].orgSlug },
      });
    } else {
      setOrgs(userOrgs);
      setIsSubmitting(false);
    }
  };

  // If the user is already signed in (e.g. after SSO redirect), automatically
  // run post-sign-in logic to redirect to dashboard or show org picker.
  // The server-side beforeLoad may miss the session due to cookie timing.
  // biome-ignore lint/correctness/useExhaustiveDependencies: only reacts to auth state changes
  useEffect(() => {
    if (ssoHandled.current) return;
    if (!isSignedIn) return;

    ssoHandled.current = true;
    handlePostSignIn();
  }, [isSignedIn]);

  /** Handle social login (Apple / Google) */
  const handleSocialAuth = async (strategy: 'oauth_apple' | 'oauth_google') => {
    if (!signIn) return;
    try {
      const { error } = await signIn.sso({
        strategy,
        redirectUrl: '/sso-callback',
        redirectCallbackUrl: '/sso-callback',
      });
      if (error) throw new Error(error.message ?? 'Social sign-in failed');
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error('Please enter your email and password');
      return;
    }

    if (!signIn) return;

    setIsSubmitting(true);

    try {
      const { error } = await signIn.password({
        emailAddress: email,
        password,
      });
      if (error) {
        throw new Error(error.message ?? 'Invalid email or password');
      }

      if (signIn.status === 'complete') {
        await signIn.finalize();
      } else {
        throw new Error(`Unexpected sign-in status: ${signIn.status}`);
      }

      await handlePostSignIn();
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
            <div className="grid gap-6">
              <div className="flex flex-col gap-4">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full cursor-pointer"
                  onClick={() => handleSocialAuth('oauth_apple')}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path
                      d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"
                      fill="currentColor"
                    />
                  </svg>
                  Login with Apple
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full cursor-pointer"
                  onClick={() => handleSocialAuth('oauth_google')}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path
                      d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                      fill="currentColor"
                    />
                  </svg>
                  Login with Google
                </Button>
              </div>
              <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
                <span className="relative z-10 bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="mt-6">
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
