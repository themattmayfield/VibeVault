import { Button } from '@/components/ui/button';
import { authClient } from '@/lib/auth-client';
import { useRouter } from '@tanstack/react-router';

const LogoutButton = () => {
  const router = useRouter();
  return (
    <Button
      className="cursor-pointer"
      variant="default"
      onClick={async () => {
        await authClient.signOut();
        router.navigate({ to: '/sign-in' });
      }}
    >
      Logout
    </Button>
  );
};

export default LogoutButton;
