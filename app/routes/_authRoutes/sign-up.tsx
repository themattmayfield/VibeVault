import { createFileRoute } from '@tanstack/react-router';
import { AuthForm } from './_auth-form';

export const Route = createFileRoute('/_authRoutes/sign-up')({
  component: AuthForm,
});
