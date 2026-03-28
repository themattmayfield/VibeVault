import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from '@tanstack/react-router';
import { type PlanTier, getPlanFeatures } from '@/lib/plan-features';

interface FeatureLockedPromptProps {
  /** The feature name to display */
  featureName: string;
  /** Description of what the feature does */
  description: string;
  /** The minimum tier required for this feature */
  requiredTier: PlanTier;
  /** Current plan tier */
  currentPlan?: PlanTier | null;
  /** The slug for the org settings link */
  slug: string;
}

export function FeatureLockedPrompt({
  featureName,
  description,
  requiredTier,
  currentPlan,
  slug,
}: FeatureLockedPromptProps) {
  const requiredFeatures = getPlanFeatures(requiredTier);

  return (
    <div className="flex min-h-[400px] items-center justify-center p-4">
      <Card className="w-full max-w-md border-2">
        <CardContent className="flex flex-col items-center gap-4 pt-8 pb-8">
          <div className="rounded-full bg-muted p-3">
            <Lock className="h-6 w-6 text-muted-foreground" />
          </div>

          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold">
              Upgrade to {requiredFeatures.label}+
            </h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>

          <div className="w-full space-y-2 pt-2">
            <p className="text-xs font-medium text-muted-foreground">
              {featureName} is available on {requiredFeatures.label} and above.
            </p>
            <Button asChild className="w-full">
              <Link
                to="/org/$slug/settings"
                params={{ slug }}
                search={{ tab: 'billing' }}
              >
                View Plans & Upgrade
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
