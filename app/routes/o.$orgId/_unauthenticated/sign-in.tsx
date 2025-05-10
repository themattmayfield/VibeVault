import { createFileRoute } from '@tanstack/react-router';
import { AuthForm } from './-auth-form';

export const Route = createFileRoute('/o/$orgId/_unauthenticated/sign-in')({
  component: AuthForm,
  ssr: false,
});
