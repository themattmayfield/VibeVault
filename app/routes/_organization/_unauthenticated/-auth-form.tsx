'use client';

import { Link, useRouterState, useRouter } from '@tanstack/react-router';

import { GalleryVerticalEnd } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { api } from 'convex/_generated/api';
import { useMutation } from 'convex/react';
import { signUpEmail } from '@/actions/auth';
import { toast } from 'sonner';
import { authClient } from 'auth-client';
import { APP_INFO } from '@/constants/app-info';
import { LOCAL_STORAGE_MOODS_KEY } from '@/constants/localStorageMoodKey';
import { createFormHook, createFormHookContexts } from '@tanstack/react-form';
import { z } from 'zod';
import { useSubmittingDots } from '@/hooks/useSubmittingDots';

const { fieldContext, formContext } = createFormHookContexts();

const { useAppForm } = createFormHook({
  fieldComponents: {
    Input,
  },
  formComponents: {
    Button,
  },
  fieldContext,
  formContext,
});

export function AuthForm() {
  const moods = localStorage.getItem(LOCAL_STORAGE_MOODS_KEY);

  const location = useRouterState({ select: (s) => s.location });
  const router = useRouter();

  const isSignIn = location.pathname === '/sign-in';

  const createUser = useMutation(api.user.createUser);
  const createMoodsFromLocalStorageUsingNeonUserId = useMutation(
    api.mood.createMoodsFromLocalStorageUsingNeonUserId
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const dots = useSubmittingDots(isSubmitting);

  const form = useAppForm({
    defaultValues: {
      email: '',
      password: '',
      name: '',
    },
    validators: {
      onSubmit: z.object({
        email: z.string().email(),
        password: z
          .string()
          .min(8, { message: 'Password must be at least 8 characters long' })
          .max(100, {
            message: 'Password must be less than 100 characters long',
          }),
        name: z.string().refine(
          (val) => {
            if (isSignIn) {
              return true;
            }
            return val.length > 0;
          },
          { message: 'Name is required' }
        ),
      }),
    },
    onSubmit: async ({ value }) => {
      try {
        setIsSubmitting(true);
        let neonUserId: string;
        if (isSignIn) {
          const { data, error } = await authClient.signIn.email({
            email: value.email,
            password: value.password,
            rememberMe: true,
          });
          if (error) {
            throw new Error(error.message);
          }
          neonUserId = data.user.id;
        } else {
          neonUserId = await signUpEmail({
            data: {
              email: value.email,
              password: value.password,
              name: value.name,
            },
          });

          await createUser({ neonUserId, displayName: value.name });
        }
        await createMoodsFromLocalStorageUsingNeonUserId({
          neonUserId,
          moods: JSON.parse(moods || '[]'),
        });
        localStorage.removeItem(LOCAL_STORAGE_MOODS_KEY);

        router.navigate({ to: '/dashboard' });
        toast.success(
          isSignIn ? 'Successfully signed in' : 'Successfully signed up'
        );
      } catch (error) {
        setIsSubmitting(false);
        toast.error(error.message);
      }
    },
  });

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <a
          href="##"
          className="flex items-center gap-2 self-center font-medium"
        >
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <GalleryVerticalEnd className="size-4" />
          </div>
          {APP_INFO.name}
        </a>
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-xl">
                {isSignIn ? 'Welcome back' : 'Create an account'}
              </CardTitle>
              <CardDescription>
                {isSignIn
                  ? 'Login with your Apple or Google account'
                  : 'Create an account with your email and password'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  form.handleSubmit();
                }}
              >
                <div className="grid gap-6">
                  <div className="flex flex-col gap-4">
                    <Button variant="outline" className="w-full cursor-pointer">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"
                          fill="currentColor"
                        />
                      </svg>
                      {isSignIn ? 'Login with Apple' : 'Sign up with Apple'}
                    </Button>
                    <Button variant="outline" className="w-full cursor-pointer">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                          fill="currentColor"
                        />
                      </svg>
                      {isSignIn ? 'Login with Google' : 'Sign up with Google'}
                    </Button>
                  </div>
                  <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
                    <span className="relative z-10 bg-background px-2 text-muted-foreground">
                      Or continue with
                    </span>
                  </div>
                  <div className="grid gap-6">
                    {!isSignIn && (
                      <div className="grid gap-2">
                        <Label htmlFor="name">Name</Label>
                        <form.AppField
                          name="name"
                          // biome-ignore lint/correctness/noChildrenProp: what
                          children={(field) => (
                            <>
                              <field.Input
                                type="text"
                                placeholder="John Doe"
                                onChange={(e) =>
                                  field.handleChange(e.target.value)
                                }
                              />
                              {field.state.meta.errors.map((error, index) => (
                                <p key={index} className="text-sm text-red-500">
                                  {error?.message}
                                </p>
                              ))}
                            </>
                          )}
                        />
                      </div>
                    )}
                    <div className="grid gap-2">
                      <Label htmlFor="email">Email</Label>
                      <form.AppField
                        name="email"
                        // biome-ignore lint/correctness/noChildrenProp: what
                        children={(field) => (
                          <>
                            <field.Input
                              type="email"
                              placeholder="m@example.com"
                              onChange={(e) =>
                                field.handleChange(e.target.value)
                              }
                            />
                            {field.state.meta.errors.map((error, index) => (
                              <p key={index} className="text-sm text-red-500">
                                {error?.message}
                              </p>
                            ))}
                          </>
                        )}
                      />
                    </div>

                    <div className="grid gap-2">
                      <div className="flex items-center">
                        <Label htmlFor="password">Password</Label>
                      </div>
                      <form.AppField
                        name="password"
                        // biome-ignore lint/correctness/noChildrenProp: what
                        children={(field) => (
                          <>
                            <field.Input
                              type="password"
                              onChange={(e) =>
                                field.handleChange(e.target.value)
                              }
                            />
                            {field.state.meta.errors.map((error, index) => (
                              <p key={index} className="text-sm text-red-500">
                                {error?.message}
                              </p>
                            ))}
                          </>
                        )}
                      />
                    </div>
                    <form.AppForm>
                      <form.Button
                        type="submit"
                        className="w-full cursor-pointer"
                      >
                        {isSubmitting
                          ? isSignIn
                            ? `Signing in${dots}`
                            : `Signing up${dots}`
                          : isSignIn
                            ? 'Login'
                            : 'Sign up'}
                      </form.Button>
                    </form.AppForm>
                  </div>
                  <div>
                    <div className="text-center text-sm">
                      {isSignIn
                        ? "Don't have an account?"
                        : 'Already have an account?'}{' '}
                      <Link
                        to={isSignIn ? '/sign-up' : '/sign-in'}
                        className="underline underline-offset-4"
                      >
                        {isSignIn ? 'Sign up' : 'Login'}
                      </Link>
                    </div>
                    <div className="text-center">
                      {isSignIn && (
                        <Link
                          to="/forgot-password"
                          className="ml-auto text-xs underline-offset-4 hover:underline"
                        >
                          Forgot your password?
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
          <Link
            to="/"
            className="cursor-pointer text-balance text-center text-md text-muted-foreground underline underline-offset-4 hover:text-primary animate-bounce"
          >
            Log your mood!
          </Link>
        </div>
      </div>
    </div>
  );
}
