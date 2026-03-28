import { createFileRoute } from '@tanstack/react-router';
import { AuthForm } from './-auth-form';

export const Route = createFileRoute('/org/$slug/_unauthenticated/sign-up')({
  component: AuthForm,
  ssr: false,
});
