import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ExternalLink, Check } from 'lucide-react';
import { toast } from 'sonner';
import {
  getCustomerPortalUrl,
  createPolarCheckoutSession,
} from '@/actions/polar';
import {
  getPlanFeatures,
  type PlanTier,
  formatPrice,
  PLAN_PRICING,
} from '@/lib/plan-features';
import type { Doc } from 'convex/_generated/dataModel';

interface BillingSettingsProps {
  orgSettings?: Doc<'orgSettings'>;
  orgSlug?: string;
  orgName?: string;
  orgEmail?: string;
}

const PLAN_ORDER: PlanTier[] = ['free', 'pro', 'team', 'enterprise'];

function getUpgradeTiers(currentPlan: PlanTier | undefined): PlanTier[] {
  const current = currentPlan ?? 'free';
  const currentIndex = PLAN_ORDER.indexOf(current);
  if (currentIndex === -1) {
    return [];
  }
  return PLAN_ORDER.slice(currentIndex + 1);
}

export function BillingSettings({
  orgSettings,
  orgSlug,
  orgName,
  orgEmail,
}: BillingSettingsProps) {
  const [portalLoading, setPortalLoading] = useState(false);
  const [upgradeLoading, setUpgradeLoading] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>(
    'monthly'
  );

  const currentPlan = (orgSettings?.plan ?? 'free') as PlanTier;
  const currentFeatures = getPlanFeatures(currentPlan);
  const upgradeTiers = getUpgradeTiers(currentPlan);
  const isEnterprise = currentPlan === 'enterprise';
  const isPaidPlan = currentPlan !== 'free';
  const isPersonal = orgSettings?.isPersonal ?? false;

  const handleOpenPortal = async () => {
    setPortalLoading(true);
    try {
      const url = await getCustomerPortalUrl();
      if (url) {
        window.open(url, '_blank');
      } else {
        toast.error(
          'No billing account found. You may not have an active subscription.'
        );
      }
    } catch {
      toast.error('Failed to open billing portal');
    } finally {
      setPortalLoading(false);
    }
  };

  const handleUpgrade = async (tier: PlanTier) => {
    if (!orgSlug || !orgName || !orgEmail) {
      toast.error('Missing required information for upgrade');
      return;
    }

    setUpgradeLoading(tier);
    try {
      const successUrl = `${window.location.origin}/org/${orgSlug}/settings?tab=billing&upgraded=true`;
      const session = await createPolarCheckoutSession({
        data: {
          country: 'US',
          plan: tier as 'pro' | 'team' | 'enterprise',
          billingCycle,
          successUrl,
          customerEmail: orgEmail,
          customerName: orgName,
          metadata: {
            clerkOrgId: orgSettings?.clerkOrgId ?? '',
          },
        },
      });

      if (session?.url) {
        window.location.href = session.url;
      } else {
        toast.error('Failed to create checkout session');
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to upgrade plan'
      );
    } finally {
      setUpgradeLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Current Plan Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Current Plan</CardTitle>
              <CardDescription>
                You are currently on the {currentFeatures.label} plan
              </CardDescription>
            </div>
            <Badge variant="default" className="text-base px-3 py-1">
              {currentFeatures.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                AI Insights
              </p>
              <p className="text-lg font-semibold">
                {currentFeatures.aiInsights
                  ? `${currentFeatures.aiInsightsPerDay === Infinity ? 'Unlimited' : currentFeatures.aiInsightsPerDay}/day`
                  : 'Not included'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Max Groups
              </p>
              <p className="text-lg font-semibold">
                {currentFeatures.maxGroups === Infinity
                  ? 'Unlimited'
                  : currentFeatures.maxGroups}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Support
              </p>
              <p className="text-lg font-semibold capitalize">
                {currentFeatures.support}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Max Members per Group
              </p>
              <p className="text-lg font-semibold">
                {currentFeatures.maxGroupMembers === Infinity
                  ? 'Unlimited'
                  : currentFeatures.maxGroupMembers}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Data Export
              </p>
              <p className="text-lg font-semibold">
                {currentFeatures.dataExport
                  ? currentFeatures.dataExport === 'api'
                    ? 'CSV + JSON + API'
                    : currentFeatures.dataExport === 'json'
                      ? 'CSV + JSON'
                      : 'CSV'
                  : 'Not included'}
              </p>
            </div>
            {currentPlan === 'team' && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Seats
                </p>
                <p className="text-lg font-semibold">
                  {orgSettings?.seatCount ?? 'N/A'} purchased
                </p>
              </div>
            )}
            {currentPlan !== 'team' && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Max Seats
                </p>
                <p className="text-lg font-semibold">
                  {currentFeatures.maxSeats === Infinity
                    ? 'Unlimited'
                    : currentFeatures.maxSeats}
                </p>
              </div>
            )}
          </div>

          <Separator />

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              onClick={handleOpenPortal}
              disabled={portalLoading}
              variant="outline"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              {portalLoading ? 'Opening...' : 'Manage Subscription'}
            </Button>
          </div>

          {isPaidPlan && (
            <div className="rounded-md bg-amber-50 p-3 text-sm text-foreground dark:bg-amber-950 dark:text-foreground">
              You can downgrade, cancel, or change your payment method through
              the billing portal.
              {currentPlan === 'team' && (
                <>
                  <br />
                  To add more seats,{' '}
                  <a
                    href="mailto:support@sentio.sh?subject=Add%20More%20Seats%20(Team%20Plan)"
                    className="underline hover:text-primary dark:hover:text-primary"
                  >
                    contact us
                  </a>{' '}
                  or upgrade to Enterprise for unlimited seats.
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upgrade Options */}
      {upgradeTiers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Upgrade Your Plan</CardTitle>
            <CardDescription>
              {isPersonal && currentPlan === 'free'
                ? 'Get AI-powered mood analysis, more groups, and data export'
                : 'Choose a plan that fits your needs'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Billing Cycle Toggle */}
            <div className="space-y-3">
              <p className="text-sm font-medium">Billing Cycle</p>
              <div className="flex gap-2">
                <Button
                  variant={billingCycle === 'monthly' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setBillingCycle('monthly')}
                >
                  Monthly
                </Button>
                <Button
                  variant={billingCycle === 'annual' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setBillingCycle('annual')}
                >
                  Annual (Save 25%)
                </Button>
              </div>
            </div>

            <Separator />

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {upgradeTiers.map((tier) => {
                const tierFeatures = getPlanFeatures(tier);
                const isLoading = upgradeLoading === tier;
                const price =
                  billingCycle === 'monthly'
                    ? PLAN_PRICING[tier].monthly
                    : PLAN_PRICING[tier].annual;
                return (
                  <div
                    key={tier}
                    className="flex flex-col rounded-lg border p-4 hover:border-primary/50 hover:shadow-sm transition-all"
                  >
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold">
                        {tierFeatures.label}
                      </h3>
                      <p className="text-2xl font-bold mt-2">
                        {formatPrice(price)}
                        <span className="text-sm font-normal text-muted-foreground">
                          {billingCycle === 'monthly' ? '/month' : '/year'}
                        </span>
                      </p>
                    </div>

                    <div className="mb-4 flex-1 space-y-2">
                      <div className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">
                          {tierFeatures.aiInsights
                            ? `${tierFeatures.aiInsightsPerDay === Infinity ? 'Unlimited' : tierFeatures.aiInsightsPerDay} AI insights/day`
                            : 'No AI insights'}
                        </span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">
                          {tierFeatures.maxGroups === Infinity
                            ? 'Unlimited groups'
                            : `Up to ${tierFeatures.maxGroups} groups`}
                        </span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">
                          {tierFeatures.globalTrends
                            ? 'Global trends dashboard'
                            : 'Personal insights only'}
                        </span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">
                          {tierFeatures.adminDashboard
                            ? 'Admin dashboard'
                            : 'No admin features'}
                        </span>
                      </div>
                    </div>

                    <Button
                      onClick={() => handleUpgrade(tier)}
                      disabled={isLoading}
                      className="w-full"
                    >
                      {isLoading ? 'Processing...' : 'Upgrade Now'}
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enterprise CTA */}
      {isEnterprise && (
        <Card>
          <CardHeader>
            <CardTitle>Enterprise Plan</CardTitle>
            <CardDescription>
              You're on our highest tier. Contact us for custom solutions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" asChild>
              <a href="mailto:support@sentio.sh?subject=Enterprise%20Custom%20Solutions">
                <ExternalLink className="mr-2 h-4 w-4" />
                Contact Sales
              </a>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
