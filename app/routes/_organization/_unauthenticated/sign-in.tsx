import { createFileRoute } from '@tanstack/react-router';
import { AuthForm } from './-auth-form';

export const Route = createFileRoute('/_organization/_unauthenticated/sign-in')({
  component: AuthForm,
  ssr: false,
});
