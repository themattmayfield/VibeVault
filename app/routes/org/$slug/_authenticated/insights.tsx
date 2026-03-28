import { Suspense } from 'react';
import {
  createFileRoute,
  useLoaderData,
  useParams,
} from '@tanstack/react-router';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { MoodInsights } from '@/components/mood-insights';
import { FeatureLockedPrompt } from '@/components/feature-locked-prompt';
import { isAtLeastTier } from '@/lib/plan-features';

export const Route = createFileRoute('/org/$slug/_authenticated/insights')({
  component: () => (
    <Suspense fallback={<InsightsSkeleton />}>
      <InsightsPage />
    </Suspense>
  ),
});

function InsightsPage() {
  const { slug } = useParams({ strict: false });
  const { orgSettings } = useLoaderData({
    from: '/org/$slug',
  });

  // Check if AI insights are enabled for this org's plan
  const aiInsightsEnabled =
    orgSettings.featureFlags?.aiInsightsEnabled ??
    isAtLeastTier(orgSettings.plan, 'pro');

  if (!aiInsightsEnabled) {
    return (
      <FeatureLockedPrompt
        featureName="Mood Insights"
        description="Get AI-powered insights into your mood patterns, triggers, and personalized suggestions to improve your wellbeing."
        requiredTier="pro"
        currentPlan={orgSettings.plan}
        slug={slug ?? ''}
      />
    );
  }

  return (
    <div className="flex flex-col">
      <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Mood Insights</h2>
          <p className="text-muted-foreground">
            Discover what drives your moods
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Your Insights</CardTitle>
            <CardDescription>
              Patterns, triggers, and suggestions based on your mood history
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MoodInsights />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function InsightsSkeleton() {
  return (
    <div className="flex flex-col">
      <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
        <div>
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-5 w-72 mt-2" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-36" />
            <Skeleton className="h-4 w-64 mt-1" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-10 w-full rounded-lg mb-4" />
            <div className="space-y-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
