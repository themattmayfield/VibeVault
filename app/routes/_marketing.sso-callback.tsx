import { createFileRoute } from '@tanstack/react-router';
import { GalleryVerticalEnd, Loader2 } from 'lucide-react';
import { APP_INFO } from '@/constants/app-info';
import { AuthenticateWithRedirectCallback } from '@clerk/tanstack-react-start';

export const Route = createFileRoute('/_marketing/sso-callback')({
  component: SSOCallbackPage,
});

function SSOCallbackPage() {
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
      <AuthenticateWithRedirectCallback
        signInForceRedirectUrl="/login"
        signUpForceRedirectUrl="/login"
      />
    </div>
  );
}
