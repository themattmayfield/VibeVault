import { Button } from '@/components/ui/button';
import { useClerk } from '@clerk/tanstack-react-start';
import { useRouter, useParams } from '@tanstack/react-router';

const LogoutButton = () => {
  const { signOut } = useClerk();
  const router = useRouter();
  const { slug } = useParams({ strict: false }) as { slug?: string };
  return (
    <Button
      className="cursor-pointer"
      variant="default"
      onClick={async () => {
        await signOut();
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
