import { createFileRoute, Link, useRouter } from '@tanstack/react-router';
import { useState } from 'react';
import { GalleryVerticalEnd } from 'lucide-react';
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
import { signUpEmail, signInEmail, createOrganization } from '@/actions/auth';
import {
  checkSlugAvailable,
  getUserOrganizations,
} from '@/actions/organization';
import { useSubmittingDots } from '@/hooks/useSubmittingDots';
import { api } from 'convex/_generated/api';
import { useMutation } from 'convex/react';

export const Route = createFileRoute('/_marketing/signup')({
  component: SignupPage,
});

/** Generate a URL-safe slug from the user's name + random suffix */
function generatePersonalSlug(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 20);
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base || 'user'}-${suffix}`;
}

function SignupPage() {
  const router = useRouter();
  const handleOrganizationOnboard = useMutation(
    api.organization.handleOrganizationOnboard
  );

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dots = useSubmittingDots(isSubmitting);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Please enter your name');
      return;
    }
    if (!email) {
      toast.error('Please enter your email');
      return;
    }
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Create or authenticate user
      let neonUserId: string;
      let isExistingUser = false;

      try {
        // Try creating a new account first
        neonUserId = await signUpEmail({
          data: { email, password, name: name.trim() },
        });
      } catch {
        // User likely already exists -- try signing them in instead
        try {
          neonUserId = await signInEmail({
            data: { email, password },
          });
          isExistingUser = true;
        } catch {
          // Sign-in also failed -- wrong password for existing account
          setIsSubmitting(false);
          toast.error('An account with this email already exists', {
            description:
              'Please sign in with your existing password to create a personal workspace.',
          });
          return;
        }
      }

      // 2. If existing user, check if they already have a personal org
      if (isExistingUser) {
        const existingOrgs = await getUserOrganizations();
        const personalOrg = existingOrgs.find(
          (o) => o.orgName?.includes("'s Space") && o.orgSlug
        );
        if (personalOrg?.orgSlug) {
          // Already has a personal org -- just redirect there
          router.navigate({
            to: '/org/$slug/dashboard',
            params: { slug: personalOrg.orgSlug },
          });
          toast.success('Welcome back! Opening your personal workspace.');
          return;
        }
      }

      // 3. Generate a unique slug for the personal org
      let slug = generatePersonalSlug(name);
      let attempts = 0;
      while (attempts < 5) {
        const available = await checkSlugAvailable({ data: { slug } });
        if (available) break;
        slug = generatePersonalSlug(name);
        attempts++;
      }

      // 4. Create personal organization in Better Auth
      const betterAuthOrgId = await createOrganization({
        data: {
          name: `${name.trim()}'s Space`,
          slug,
          userId: neonUserId,
        },
      });

      // 5. Create Convex user + org settings (marked as personal)
      await handleOrganizationOnboard({
        neonUserId,
        displayName: name.trim(),
        slug,
        betterAuthOrgId,
        isPersonal: true,
      });

      // 6. Redirect straight to dashboard -- no payment for personal tier
      router.navigate({
        to: '/org/$slug/dashboard',
        params: { slug },
      });

      toast.success(
        isExistingUser
          ? 'Personal workspace created!'
          : `Account created! Welcome to ${APP_INFO.name}`
      );
    } catch (error) {
      setIsSubmitting(false);
      const message =
        error instanceof Error ? error.message : 'An unexpected error occurred';
      toast.error('Signup failed', { description: message });
    }
  };

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
            <CardTitle className="text-xl">Create your account</CardTitle>
            <CardDescription>Start tracking your mood for free</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
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
                  {password && password.length < 8 && (
                    <p className="text-xs text-red-500">
                      Must be at least 8 characters
                    </p>
                  )}
                </div>
                <Button
                  type="submit"
                  className="w-full cursor-pointer"
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? `Creating account${dots}`
                    : 'Get started free'}
                </Button>
              </div>
            </form>
            <div className="mt-4 text-center text-sm">
              Already have an account?{' '}
              <Link to="/login" className="underline underline-offset-4">
                Sign in
              </Link>
            </div>
            <div className="mt-2 text-center text-sm">
              <Link
                to="/join"
                className="text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
              >
                Setting up an organization?
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
