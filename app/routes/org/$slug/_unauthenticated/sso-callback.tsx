import { createFileRoute, useRouter } from '@tanstack/react-router';
import { useEffect, useRef } from 'react';
import { GalleryVerticalEnd, Loader2 } from 'lucide-react';
import { APP_INFO } from '@/constants/app-info';
import {
  AuthenticateWithRedirectCallback,
  useAuth,
} from '@clerk/tanstack-react-start';
import { useConvex, useMutation } from 'convex/react';
import { api } from 'convex/_generated/api';
import { addMemberToOrganization } from '@/actions/organization';
import { useOrgSettings } from '@/hooks/use-org-settings';
import { LOCAL_STORAGE_MOODS_KEY } from '@/constants/localStorageMoodKey';
import { toast } from 'sonner';

export const Route = createFileRoute(
  '/org/$slug/_unauthenticated/sso-callback'
)({
  component: OrgSSOCallbackPage,
});

function OrgSSOCallbackPage() {
  const { slug } = Route.useParams();
  const router = useRouter();
  const { isSignedIn, userId } = useAuth();
  const { orgSettings } = useOrgSettings();
  const convex = useConvex();
  const createUser = useMutation(api.user.createUser);
  const createMoodsFromLocalStorage = useMutation(
    api.mood.createMoodsFromLocalStorage
  );
  const handled = useRef(false);

  // Once the OAuth exchange completes and the user is signed in,
  // run post-auth setup (create Convex user, add to org, migrate moods)
  // and navigate directly to the dashboard.
  // biome-ignore lint/correctness/useExhaustiveDependencies: only reacts to auth state changes
  useEffect(() => {
    if (handled.current) return;
    if (!isSignedIn || !userId) return;

    handled.current = true;

    const setup = async () => {
      try {
        // Check if this user already has a Convex record
        const existingUser = await convex.query(api.user.getUserByClerkId, {
          clerkUserId: userId,
        });

        if (!existingUser) {
          // New user via OAuth sign-up -- create Convex user + add to org
          await createUser({
            clerkUserId: userId,
            displayName: '',
          });

          await addMemberToOrganization({
            data: {
              userId,
              organizationId: orgSettings.clerkOrgId ?? '',
              role: 'member',
            },
          });
        }

        // Migrate any local storage moods
        const moods = localStorage.getItem(LOCAL_STORAGE_MOODS_KEY);
        await createMoodsFromLocalStorage({
          clerkUserId: userId,
          moods: JSON.parse(moods || '[]'),
          organizationId: orgSettings.clerkOrgId ?? '',
        });
        localStorage.removeItem(LOCAL_STORAGE_MOODS_KEY);

        router.navigate({
          to: '/org/$slug/dashboard',
          params: { slug },
        });

        toast.success(
          existingUser ? 'Successfully signed in' : 'Successfully signed up'
        );
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : 'Something went wrong'
        );
        router.navigate({
          to: '/org/$slug/sign-in',
          params: { slug },
        });
      }
    };

    setup();
  }, [isSignedIn, userId]);

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col items-center gap-4">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <GalleryVerticalEnd className="size-4" />
        </div>
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">
          Completing sign-in to {APP_INFO.name}...
        </p>
      </div>
      {/* Complete the OAuth exchange without redirecting -- the useEffect
          above handles navigation once the session is established. */}
      <AuthenticateWithRedirectCallback />
    </div>
  );
}
