import { Button } from '@/components/ui/button';
import { authClient } from 'auth-client';
import { useRouter, useParams } from '@tanstack/react-router';

const LogoutButton = () => {
  const router = useRouter();
  const { slug } = useParams({ strict: false }) as { slug?: string };
  return (
    <Button
      className="cursor-pointer"
      variant="default"
      onClick={async () => {
        await authClient.signOut();
        if (slug) {
          router.navigate({
            to: '/org/$slug/sign-in',
            params: { slug },
          });
        } else {
          router.navigate({ to: '/' });
        }
      }}
    >
      Logout
    </Button>
  );
};

export default LogoutButton;
