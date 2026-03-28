import { createFileRoute } from '@tanstack/react-router';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  CreditCard,
  Building,
  User,
  Check,
  Loader2,
} from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { Link } from '@tanstack/react-router';
import { APP_INFO } from '@/constants/app-info';
import { api } from 'convex/_generated/api';
import { useMutation } from 'convex/react';
import { createPolarCheckoutSession } from '@/actions/polar';
import { signUpEmail, createOrganization } from '@/actions/auth';
import { checkSlugAvailable } from '@/actions/organization';
import { useRef, useCallback } from 'react';

export const Route = createFileRoute('/_marketing/join')({
  component: RouteComponent,
});

function RouteComponent() {
  const handleOrganizationOnboard = useMutation(
    api.organization.handleOrganizationOnboard
  );

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);
  const [isSlugAvailable, setIsSlugAvailable] = useState<boolean | null>(null);

  const [formData, setFormData] = useState({
    // Plan selection
    plan: 'small',
    billingCycle: 'annual',

    // Organization details
    organizationName: '',
    slug: '',

    // Personal details
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'administrator',
  });

  const plans = [
    {
      id: 'small',
      name: 'Small Institution',
      price: { annual: 499, monthly: 599 },
      description: 'Up to 250 users',
      features: [
        '5 administrator accounts',
        'Basic analytics',
        'Email support',
      ],
    },
    {
      id: 'medium',
      name: 'Medium Institution',
      price: { annual: 999, monthly: 1199 },
      description: 'Up to 1,000 users',
      features: [
        '15 administrator accounts',
        'Advanced analytics',
        'Priority support',
      ],
    },
    {
      id: 'enterprise',
      name: 'Large Institution',
      price: { annual: 1999, monthly: 2399 },
      description: 'Unlimited users',
      features: [
        'Unlimited administrator accounts',
        'Enterprise analytics',
        'Dedicated support',
      ],
    },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, type, checked } = e.target;
    let { value } = e.target;

    // Normalize slug to lowercase, strip invalid chars
    if (name === 'slug') {
      value = value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    }

    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });

    // Check slug availability when typing
    if (name === 'slug') {
      if (value) {
        checkSlugAvailability(value);
      } else {
        setIsSlugAvailable(null);
      }
    }
  };

  const handlePlanSelect = (plan) => {
    setFormData({
      ...formData,
      plan,
    });
  };

  const handleBillingCycleChange = (cycle) => {
    setFormData({
      ...formData,
      billingCycle: cycle,
    });
  };

  const slugCheckTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const SLUG_REGEX = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;

  const checkSlugAvailability = useCallback((value: string) => {
    // Clear any pending debounced check
    if (slugCheckTimeout.current) {
      clearTimeout(slugCheckTimeout.current);
    }

    const normalized = value.toLowerCase();

    if (normalized.length < 3) {
      setIsSlugAvailable(null);
      return;
    }

    if (!SLUG_REGEX.test(normalized)) {
      setIsSlugAvailable(false);
      return;
    }

    setIsCheckingSlug(true);

    // Debounce the API call to avoid hammering on every keystroke
    slugCheckTimeout.current = setTimeout(async () => {
      try {
        const isAvailable = await checkSlugAvailable({
          data: { slug: normalized },
        });
        setIsSlugAvailable(isAvailable);
      } catch {
        setIsSlugAvailable(null);
      } finally {
        setIsCheckingSlug(false);
      }
    }, 400);
  }, []);

  const validateCurrentStep = () => {
    switch (currentStep) {
      case 1: // Plan selection
        return true;
      case 2: // Organization details
        return formData.organizationName && formData.slug && isSlugAvailable;
      case 3: {
        // Personal details
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return (
          formData.firstName.trim().length > 0 &&
          formData.lastName.trim().length > 0 &&
          emailRegex.test(formData.email) &&
          formData.password.length >= 8 &&
          formData.confirmPassword.length > 0 &&
          formData.password === formData.confirmPassword
        );
      }
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (validateCurrentStep()) {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    } else {
      toast.error('Please complete all required fields', {
        description:
          'Make sure all required information is provided before continuing.',
      });
    }
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
    window.scrollTo(0, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateCurrentStep()) {
      toast.error('Please complete all required fields', {
        description:
          'Make sure all required information is provided before submitting.',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const name = `${formData.firstName} ${formData.lastName}`;

      // 1. Create user in Better Auth (Neon Postgres)
      const neonUserId = await signUpEmail({
        data: {
          email: formData.email,
          password: formData.password,
          name,
        },
      });

      // 2. Create organization in Better Auth
      const betterAuthOrgId = await createOrganization({
        data: {
          name: formData.organizationName,
          slug: formData.slug,
          userId: neonUserId,
        },
      });

      // 3. Create Convex user + org settings (linked to Better Auth org)
      await handleOrganizationOnboard({
        neonUserId,
        displayName: name,
        slug: formData.slug,
        betterAuthOrgId,
        role: formData.role,
      });

      // 4. Create Polar checkout session and redirect to payment
      const result = await createPolarCheckoutSession({
        data: {
          country: 'US',
          plan: formData.plan as 'small' | 'medium' | 'enterprise',
          billingCycle: formData.billingCycle as 'annual' | 'monthly',
          successUrl: `${window.location.origin}/org/${formData.slug}/welcome?checkout_id={CHECKOUT_ID}&email=${encodeURIComponent(formData.email)}`,
          customerEmail: formData.email,
          customerName: name,
        },
      });
      window.location.href = result.url;
    } catch (error) {
      setIsSubmitting(false);
      const message =
        error instanceof Error ? error.message : 'An unexpected error occurred';
      toast.error('Registration failed', {
        description: message,
      });
    }
  };

  const renderStepIndicator = () => {
    return (
      <div className="flex items-center justify-center mb-8">
        <div className="flex items-center">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full border-2 
                    ${
                      currentStep >= step
                        ? 'bg-primary border-primary text-primary-foreground'
                        : 'border-muted-foreground text-muted-foreground'
                    }`}
              >
                {currentStep > step ? <Check className="h-4 w-4" /> : step}
              </div>
              {step < 3 && (
                <div
                  className={`w-12 h-0.5 ${currentStep > step ? 'bg-primary' : 'bg-muted-foreground'}`}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="container max-w-5xl py-10 mx-auto">
      <div className="mb-8 flex justify-between items-center">
        <Link
          to="/"
          className="flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to home
        </Link>
        <div className="flex items-center gap-4">
          <Link
            to="/signup"
            className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4"
          >
            Just want a personal account?
          </Link>
          <Link
            to="/login"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Already have an account?{' '}
            <span className="underline underline-offset-4">Sign in</span>
          </Link>
        </div>
      </div>

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
      </div>

      {currentStep < 4 && renderStepIndicator()}

      {currentStep === 1 && (
        <Card className="mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Select Your Plan
            </CardTitle>
            <CardDescription>
              Choose the plan that best fits your institution's needs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <div className="bg-muted p-3 rounded-lg inline-flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-primary" />
                <span className="text-sm">
                  14-day free trial with all plans
                </span>
              </div>
            </div>

            <div className="flex justify-center mb-6">
              <div className="inline-flex items-center rounded-lg border p-1">
                <Button
                  variant={
                    formData.billingCycle === 'annual' ? 'default' : 'ghost'
                  }
                  size="sm"
                  onClick={() => handleBillingCycleChange('annual')}
                  className="relative"
                >
                  Annual
                  <span className="absolute -top-2 -right-2 bg-primary/20 text-primary text-[10px] px-1 rounded">
                    Save 20%
                  </span>
                </Button>
                <Button
                  variant={
                    formData.billingCycle === 'monthly' ? 'default' : 'ghost'
                  }
                  size="sm"
                  onClick={() => handleBillingCycleChange('monthly')}
                >
                  Monthly
                </Button>
              </div>
            </div>

            <div className="grid gap-4">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    formData.plan === plan.id
                      ? 'border-primary bg-primary/5 ring-1 ring-primary'
                      : 'hover:border-primary/50'
                  }`}
                  onClick={() => handlePlanSelect(plan.id)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-medium text-lg">{plan.name}</h3>
                      <p className="text-muted-foreground text-sm">
                        {plan.description}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">
                        ${plan.price[formData.billingCycle]}
                        <span className="text-sm font-normal text-muted-foreground">
                          /mo
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formData.billingCycle === 'annual'
                          ? 'billed annually'
                          : 'billed monthly'}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    {plan.features.map((feature, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={nextStep}>
              Continue <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      )}

      {currentStep === 2 && (
        <Card className="mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Organization Details
            </CardTitle>
            <CardDescription>Tell us about your institution</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="organizationName">Organization Name</Label>
              <Input
                id="organizationName"
                name="organizationName"
                value={formData.organizationName}
                onChange={handleChange}
                placeholder="e.g. Westlake High School"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Choose Your URL</Label>
              <div className="flex">
                <div className="flex items-center bg-muted px-3 border border-r-0 rounded-l-md text-muted-foreground">
                  {APP_INFO.domain}/org/
                </div>
                <div className="relative flex-1">
                  <Input
                    id="slug"
                    name="slug"
                    value={formData.slug}
                    onChange={handleChange}
                    placeholder="your-organization"
                    className="pr-10 rounded-l-none"
                    required
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {isCheckingSlug && (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                    {!isCheckingSlug && isSlugAvailable === true && (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                    {!isCheckingSlug && isSlugAvailable === false && (
                      <span className="text-red-500 text-sm">✕</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {isCheckingSlug && 'Checking availability...'}
                {!isCheckingSlug &&
                  isSlugAvailable === true &&
                  formData.slug && (
                    <span className="text-green-500">URL is available!</span>
                  )}
                {!isCheckingSlug &&
                  isSlugAvailable === false &&
                  formData.slug && (
                    <span className="text-red-500">
                      {SLUG_REGEX.test(formData.slug.toLowerCase())
                        ? 'This URL slug is already taken. Please choose another.'
                        : 'Only lowercase letters, numbers, and hyphens allowed. Must start and end with a letter or number.'}
                    </span>
                  )}
                {!isCheckingSlug &&
                  isSlugAvailable === null &&
                  `This will be your organization's URL on ${APP_INFO.name}.`}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={prevStep}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <Button
              onClick={nextStep}
              disabled={
                !formData.organizationName || !formData.slug || !isSlugAvailable
              }
            >
              Continue <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      )}

      {currentStep === 3 && (
        <Card className="mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Your Details
            </CardTitle>
            <CardDescription>Create your administrator account</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Work Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
              {formData.email &&
                !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) && (
                  <p className="text-xs text-red-500">
                    Please enter a valid email address
                  </p>
                )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                <p
                  className={`text-xs ${formData.password && formData.password.length < 8 ? 'text-red-500' : 'text-muted-foreground'}`}
                >
                  Must be at least 8 characters
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
                {formData.password &&
                  formData.confirmPassword &&
                  formData.password !== formData.confirmPassword && (
                    <p className="text-xs text-red-500">
                      Passwords do not match
                    </p>
                  )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Your Role</Label>
              <RadioGroup
                value={formData.role}
                onValueChange={(value) =>
                  setFormData({ ...formData, role: value })
                }
                className="grid grid-cols-2 gap-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="administrator" id="administrator" />
                  <Label htmlFor="administrator" className="font-normal">
                    Administrator
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="teacher" id="teacher" />
                  <Label htmlFor="teacher" className="font-normal">
                    Teacher/Educator
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="counselor" id="counselor" />
                  <Label htmlFor="counselor" className="font-normal">
                    Counselor
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="healthcare" id="healthcare" />
                  <Label htmlFor="healthcare" className="font-normal">
                    Healthcare Provider
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={prevStep}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <Button disabled={isSubmitting} onClick={handleSubmit}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating
                  account...
                </>
              ) : (
                <>
                  Continue to Payment <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
