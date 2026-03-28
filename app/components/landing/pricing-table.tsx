'use client';

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
import { Check } from 'lucide-react';

export function PricingTable() {
  const [isAnnual, setIsAnnual] = useState(false);

  const tiers = [
    {
      name: 'Free',
      tagline: 'For individuals getting started',
      monthlyPrice: 0,
      annualPrice: 0,
      savingsPercent: 0,
      buttonText: 'Get Started Free',
      buttonHref: '/signup',
      highlighted: false,
      features: [
        'Mood tracking (unlimited)',
        'Mood calendar',
        'Basic dashboard stats',
        '1 group (5 members max)',
        'Community support',
      ],
    },
    {
      name: 'Pro',
      tagline: 'For power users',
      monthlyPrice: 8,
      annualPrice: 6,
      savingsPercent: 25,
      buttonText: 'Start Free Trial',
      buttonHref: '/signup',
      highlighted: true,
      features: [
        'Everything in Free',
        'AI-powered insights (1/day)',
        '5 groups (25 members each)',
        'Full dashboard analytics',
        'Data export (CSV)',
        'Email support',
      ],
    },
    {
      name: 'Team',
      tagline: 'For organizations',
      monthlyPrice: 29,
      annualPrice: 22,
      savingsPercent: 24,
      buttonText: 'Get Started',
      buttonHref: '/join',
      highlighted: false,
      features: [
        'Everything in Pro',
        'Unlimited groups & members',
        'Global trends dashboard',
        'Admin dashboard',
        'Data export (JSON)',
        'Custom branding',
        'Priority support',
      ],
    },
    {
      name: 'Enterprise',
      tagline: 'For large organizations',
      monthlyPrice: 99,
      annualPrice: 82.5,
      savingsPercent: 17,
      buttonText: 'Contact Sales',
      buttonHref: '#contact',
      highlighted: false,
      features: [
        'Everything in Team',
        'Unlimited seats',
        'API access',
        'Dedicated account manager',
        'SLA guarantees',
      ],
    },
  ];

  const currentPrice = (tier: (typeof tiers)[0]) => {
    return isAnnual ? tier.annualPrice : tier.monthlyPrice;
  };

  const formatPrice = (price: number) => {
    if (price === 0) return 'Free';
    return `$${price}`;
  };

  return (
    <section id="pricing" className="w-full py-12 md:py-24 lg:py-32">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">
              Pricing
            </div>
            <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">
              Simple, Transparent Pricing
            </h2>
            <p className="max-w-[700px] text-muted-foreground md:text-xl">
              Choose the plan that fits your needs. Start free, upgrade anytime.
            </p>
          </div>

          {/* Billing Toggle */}
          <div className="flex items-center gap-4 mt-8">
            <span
              className={`text-sm font-medium ${
                !isAnnual ? 'text-foreground' : 'text-muted-foreground'
              }`}
            >
              Monthly
            </span>
            <button
              type="button"
              onClick={() => setIsAnnual(!isAnnual)}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                isAnnual ? 'bg-primary' : 'bg-muted'
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                  isAnnual ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
            <span
              className={`text-sm font-medium ${
                isAnnual ? 'text-foreground' : 'text-muted-foreground'
              }`}
            >
              Annual
            </span>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mt-12 max-w-7xl mx-auto">
          {tiers.map((tier) => (
            <Card
              key={tier.name}
              className={tier.highlighted ? 'border-primary lg:scale-105' : ''}
            >
              <CardHeader>
                {tier.highlighted && (
                  <div className="text-center text-sm font-medium text-primary mb-2">
                    Most Popular
                  </div>
                )}
                <CardTitle>{tier.name}</CardTitle>
                <CardDescription>{tier.tagline}</CardDescription>
                <div className="mt-4">
                  <div className="text-4xl font-bold">
                    {formatPrice(currentPrice(tier))}
                  </div>
                  {tier.monthlyPrice > 0 && (
                    <div className="text-sm text-muted-foreground">
                      {isAnnual ? 'per seat/year' : 'per month'}
                    </div>
                  )}
                  {isAnnual && tier.savingsPercent > 0 && (
                    <div className="mt-2 inline-block rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                      Save {tier.savingsPercent}%
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3 text-sm">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  variant={tier.highlighted ? 'default' : 'outline'}
                  asChild
                >
                  <a href={tier.buttonHref}>{tier.buttonText}</a>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-muted-foreground">
            All plans include core features: unlimited mood tracking, mood
            calendar, and basic dashboard stats.
          </p>
        </div>
      </div>
    </section>
  );
}
