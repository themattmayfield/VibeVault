import { Button } from '@/components/ui/button';
import { authClient } from 'auth-client';
import { useRouter, useParams } from '@tanstack/react-router';

const LogoutButton = () => {
  const router = useRouter();
  const { orgId } = useParams({
    from: '/o/$orgId',
  });
  return (
    <Button
      className="cursor-pointer"
      variant="default"
      onClick={async () => {
        await authClient.signOut();
        router.navigate({ to: '/o/$orgId/sign-in', params: { orgId } });
      }}
    >
      Logout
    </Button>
  );
};

export default LogoutButton;
