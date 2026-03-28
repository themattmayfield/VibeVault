import { createFileRoute, useParams } from '@tanstack/react-router';
import { FeatureLockedPrompt } from '@/components/feature-locked-prompt';
import { isAtLeastTier } from '@/lib/plan-features';
import { useOrgSettings } from '@/hooks/use-org-settings';

export const Route = createFileRoute('/org/$slug/_authenticated/admin')({
  component: RouteComponent,
});

function RouteComponent() {
  const { slug } = useParams({ strict: false });
  const { orgSettings } = useOrgSettings();

  // Check if admin dashboard is enabled for this org's plan
  const adminDashboardEnabled =
    orgSettings.featureFlags?.adminDashboardEnabled ??
    isAtLeastTier(orgSettings.plan, 'team');

  if (!adminDashboardEnabled) {
    return (
      <FeatureLockedPrompt
        featureName="Admin Dashboard"
        description="Manage organization settings, members, billing, and view comprehensive admin controls."
        requiredTier="team"
        currentPlan={orgSettings.plan}
        slug={slug ?? ''}
      />
    );
  }

  return <div>Admin Dashboard</div>;
}
