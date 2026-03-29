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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ExternalLink } from 'lucide-react';
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

function getNextTier(currentPlan: PlanTier | undefined): PlanTier | null {
  const current = currentPlan ?? 'free';
  const currentIndex = PLAN_ORDER.indexOf(current);
  if (currentIndex === -1 || currentIndex === PLAN_ORDER.length - 1) {
    return null;
  }
  return PLAN_ORDER[currentIndex + 1];
}

function FeatureComparison({
  currentPlan,
  nextPlan,
}: {
  currentPlan: PlanTier;
  nextPlan: PlanTier;
}) {
  const currentFeatures = getPlanFeatures(currentPlan);
  const nextFeatures = getPlanFeatures(nextPlan);

  const featureKeys: (keyof typeof currentFeatures)[] = [
    'aiInsights',
    'aiInsightsPerDay',
    'maxGroups',
    'maxGroupMembers',
    'globalTrends',
    'adminDashboard',
    'dataExport',
    'customBranding',
    'support',
    'maxSeats',
    'publicMoods',
  ];

  const featureLabels: Record<string, string> = {
    aiInsights: 'AI Insights',
    aiInsightsPerDay: 'AI Insights per Day',
    maxGroups: 'Max Groups',
    maxGroupMembers: 'Max Members per Group',
    globalTrends: 'Global Trends',
    adminDashboard: 'Admin Dashboard',
    dataExport: 'Data Export',
    customBranding: 'Custom Branding',
    support: 'Support Level',
    maxSeats: 'Max Seats',
    publicMoods: 'Public Mood Sharing',
  };

  const formatFeatureValue = (value: unknown): string => {
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'number') {
      if (value === Infinity) return 'Unlimited';
      return value.toString();
    }
    if (typeof value === 'string') {
      return value.charAt(0).toUpperCase() + value.slice(1);
    }
    return String(value);
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-1/3">Feature</TableHead>
            <TableHead className="w-1/3 text-center">
              {currentFeatures.label}
            </TableHead>
            <TableHead className="w-1/3 text-center">
              {nextFeatures.label}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {featureKeys.map((key) => {
            const currentValue = currentFeatures[key];
            const nextValue = nextFeatures[key];
            const isImprovement =
              JSON.stringify(currentValue) !== JSON.stringify(nextValue);

            return (
              <TableRow key={key}>
                <TableCell className="font-medium">
                  {featureLabels[key]}
                </TableCell>
                <TableCell className="text-center">
                  {formatFeatureValue(currentValue)}
                </TableCell>
                <TableCell
                  className={`text-center ${isImprovement ? 'font-semibold text-green-600 dark:text-green-400' : ''}`}
                >
                  {formatFeatureValue(nextValue)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

export function BillingSettings({
  orgSettings,
  orgSlug,
  orgName,
  orgEmail,
}: BillingSettingsProps) {
  const [portalLoading, setPortalLoading] = useState(false);
  const [upgradeLoading, setUpgradeLoading] = useState(false);

  const currentPlan = (orgSettings?.plan ?? 'free') as PlanTier;
  const currentFeatures = getPlanFeatures(currentPlan);
  const nextTier = getNextTier(currentPlan);
  const isEnterprise = currentPlan === 'enterprise';

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

  const handleUpgrade = async () => {
    if (!nextTier || !orgSlug || !orgName || !orgEmail) {
      toast.error('Missing required information for upgrade');
      return;
    }

    setUpgradeLoading(true);
    try {
      const successUrl = `${window.location.origin}/org/${orgSlug}/settings?tab=billing&upgraded=true`;
      const session = await createPolarCheckoutSession({
        data: {
          country: 'US',
          plan: nextTier as 'pro' | 'team' | 'enterprise',
          billingCycle: 'monthly',
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
      setUpgradeLoading(false);
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
                  ? currentFeatures.dataExport.toUpperCase()
                  : 'Not included'}
              </p>
            </div>
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
        </CardContent>
      </Card>

      {/* Plan Comparison */}
      {nextTier && (
        <Card>
          <CardHeader>
            <CardTitle>Upgrade to {getPlanFeatures(nextTier).label}</CardTitle>
            <CardDescription>
              See what you'll get with the next tier
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FeatureComparison currentPlan={currentPlan} nextPlan={nextTier} />

            <Separator />

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {getPlanFeatures(nextTier).label} Plan
                </p>
                <p className="text-2xl font-bold">
                  {formatPrice(PLAN_PRICING[nextTier].monthly)}
                  <span className="text-sm font-normal text-muted-foreground">
                    /month
                  </span>
                </p>
              </div>
              <Button
                onClick={handleUpgrade}
                disabled={upgradeLoading}
                size="lg"
              >
                {upgradeLoading ? 'Processing...' : 'Upgrade Now'}
              </Button>
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
            <Button variant="outline">Contact Sales</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
