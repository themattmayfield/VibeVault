import { createFileRoute } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ArrowLeft, CheckCircle, Globe } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { APP_INFO } from '@/constants/app-info';
import { authClient } from 'auth-client';

export const Route = createFileRoute('/_public/welcome')({
  component: RouteComponent,
  beforeLoad: async ({ context }) => {
    // check that a checkout exists from polar
    // check that email exists in url
    // verify it.
  },
});
// For the subdomain and the email, we can know what link to sent the user.

function RouteComponent() {
  const { email, checkout_id } = Route.useSearch();
  console.log(email, checkout_id);
  // const { subdomain } = useLoaderData({
  //   from: '/_organization',
  // });
  const subdomain = 'test';

  const sendVerificationEmail = async () => {
    await authClient.sendVerificationEmail({
      email: email,
      callbackURL: '/admin',
    });
  };

  return (
    <div className="container max-w-5xl py-10 mx-auto">
      <div className="mb-8 md:mb-16 flex justify-between items-center">
        <Link
          to="/"
          className="flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to home
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Already have an account?
          </span>
          <Button variant="outline" size="sm" asChild>
            <Link to="/sign-in">Log in</Link>
          </Button>
        </div>
      </div>
      {/* 
      <div className="flex flex-col items-center mb-8">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
            MB
          </div>
          <span className="font-bold text-xl">{APP_INFO.name}</span>
        </div>
        <h1 className="text-3xl font-bold text-center">
          Create Your {APP_INFO.name} Account
        </h1>
        <p className="text-muted-foreground text-center mt-2">
          Set up your organization and start your 14-day free trial
        </p>
      </div> */}

      <Card className="mx-auto max-w-3xl">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <CheckCircle className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Your Account is Ready!</CardTitle>
          <CardDescription>Welcome to {APP_INFO.name}.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-lg">
            <h3 className="font-medium mb-2">Your {APP_INFO.name} URL:</h3>
            <div className="flex items-center justify-center">
              <div className="bg-background border rounded-md px-4 py-2 flex items-center gap-2">
                <Globe className="h-4 w-4 text-primary" />
                <span className="font-medium">
                  {subdomain}.{APP_INFO.domain}
                </span>
              </div>
            </div>
            <p className="text-sm text-center mt-2">
              Bookmark this URL to easily access your {APP_INFO.name} instance
            </p>
          </div>

          <div className="bg-primary/10 p-4 rounded-lg">
            <h3 className="font-medium mb-2">
              Early Adopter Benefits Activated:
            </h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-primary" />
                <span>20% off first year</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-primary" />
                <span>Free onboarding ($1,500 value)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-primary" />
                <span>Priority support</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-primary" />
                <span>Extended 30-day trial</span>
              </li>
            </ul>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button onClick={sendVerificationEmail} className="w-full">
            Send verification email
          </Button>
          <div className="text-center text-sm text-muted-foreground">
            Need help getting started?{' '}
            <Link to="#" className="text-primary hover:underline">
              Schedule an onboarding call
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
