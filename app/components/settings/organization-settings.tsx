import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { updateOrganization } from '@/actions/organization';
import { useMutation } from 'convex/react';
import { api } from 'convex/_generated/api';
import type { Doc } from 'convex/_generated/dataModel';
import { getPlanFeatures, type PlanTier } from '@/lib/plan-features';

interface OrganizationSettingsProps {
  orgSettings: Doc<'orgSettings'>;
  orgName: string;
  orgSlug: string;
  betterAuthOrgId: string;
}

export function OrganizationSettings({
  orgSettings,
  orgName,
  orgSlug,
  betterAuthOrgId,
}: OrganizationSettingsProps) {
  const [name, setName] = useState(orgName);
  const [slug, setSlug] = useState(orgSlug);
  const [orgLoading, setOrgLoading] = useState(false);

  const plan = (orgSettings.plan ?? 'free') as PlanTier;
  const planFeatures = getPlanFeatures(plan);
  const flags = orgSettings.featureFlags;
  const [groupsEnabled, setGroupsEnabled] = useState(
    flags?.groupsEnabled ?? true
  );
  const [globalTrendsEnabled, setGlobalTrendsEnabled] = useState(
    flags?.globalTrendsEnabled ?? false
  );
  const [publicMoodsEnabled, setPublicMoodsEnabled] = useState(
    flags?.publicMoodsEnabled ?? false
  );
  const [aiInsightsEnabled, setAiInsightsEnabled] = useState(
    flags?.aiInsightsEnabled ?? false
  );
  const [adminDashboardEnabled, setAdminDashboardEnabled] = useState(
    flags?.adminDashboardEnabled ?? false
  );
  const [flagsLoading, setFlagsLoading] = useState(false);

  const updateConvexOrgSettings = useMutation(
    api.organization.updateOrgSettings
  );

  const handleOrgUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Organization name cannot be empty');
      return;
    }
    setOrgLoading(true);
    try {
      await updateOrganization({
        data: {
          organizationId: betterAuthOrgId,
          name: name.trim(),
          slug: slug.trim(),
        },
      });
      toast.success('Organization updated');
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to update organization'
      );
    } finally {
      setOrgLoading(false);
    }
  };

  const handleFlagsSave = async () => {
    setFlagsLoading(true);
    try {
      await updateConvexOrgSettings({
        betterAuthOrgId,
        featureFlags: {
          groupsEnabled,
          globalTrendsEnabled,
          publicMoodsEnabled,
          aiInsightsEnabled,
          adminDashboardEnabled,
        },
      });
      toast.success('Feature flags updated');
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to update feature flags'
      );
    } finally {
      setFlagsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Org Details */}
      <Card>
        <CardHeader>
          <CardTitle>Organization Details</CardTitle>
          <CardDescription>
            Update your organization name and URL slug.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleOrgUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="orgName">Organization Name</Label>
              <Input
                id="orgName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Acme Inc."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="orgSlug">URL Slug</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  moodsync.com/org/
                </span>
                <Input
                  id="orgSlug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="acme"
                />
              </div>
            </div>
            <Button type="submit" disabled={orgLoading}>
              {orgLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Separator />

      {/* Feature Flags */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Features
            <Badge variant="outline">{planFeatures.label} Plan</Badge>
          </CardTitle>
          <CardDescription>
            Enable or disable features for your organization. Some features
            require a higher plan tier.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="groups-flag">Groups</Label>
              <p className="text-sm text-muted-foreground">
                Allow members to create and join mood-sharing groups.
              </p>
            </div>
            <Switch
              id="groups-flag"
              checked={groupsEnabled}
              onCheckedChange={setGroupsEnabled}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="insights-flag">
                AI Insights
                {!planFeatures.aiInsights && (
                  <Badge variant="outline" className="ml-2 text-xs">
                    Pro+
                  </Badge>
                )}
              </Label>
              <p className="text-sm text-muted-foreground">
                Enable AI-powered mood pattern analysis and suggestions.
              </p>
            </div>
            <Switch
              id="insights-flag"
              checked={aiInsightsEnabled}
              onCheckedChange={setAiInsightsEnabled}
              disabled={!planFeatures.aiInsights}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="trends-flag">
                Global Trends
                {!planFeatures.globalTrends && (
                  <Badge variant="outline" className="ml-2 text-xs">
                    Team+
                  </Badge>
                )}
              </Label>
              <p className="text-sm text-muted-foreground">
                Show organization-wide mood trend analytics.
              </p>
            </div>
            <Switch
              id="trends-flag"
              checked={globalTrendsEnabled}
              onCheckedChange={setGlobalTrendsEnabled}
              disabled={!planFeatures.globalTrends}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="admin-flag">
                Admin Dashboard
                {!planFeatures.adminDashboard && (
                  <Badge variant="outline" className="ml-2 text-xs">
                    Team+
                  </Badge>
                )}
              </Label>
              <p className="text-sm text-muted-foreground">
                Enable the admin dashboard for organization management.
              </p>
            </div>
            <Switch
              id="admin-flag"
              checked={adminDashboardEnabled}
              onCheckedChange={setAdminDashboardEnabled}
              disabled={!planFeatures.adminDashboard}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="public-flag">Public Moods</Label>
              <p className="text-sm text-muted-foreground">
                Allow moods to be visible to other organization members by
                default.
              </p>
            </div>
            <Switch
              id="public-flag"
              checked={publicMoodsEnabled}
              onCheckedChange={setPublicMoodsEnabled}
            />
          </div>
          <Button onClick={handleFlagsSave} disabled={flagsLoading}>
            {flagsLoading ? 'Saving...' : 'Save Feature Settings'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
