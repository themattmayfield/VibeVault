import { Suspense } from 'react';
import { createFileRoute, Link, useParams } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MoodPieChart } from '@/components/mood-pie-chart';
import { MoodTimeline } from '@/components/mood-timeline';
import { FeatureLockedPrompt } from '@/components/feature-locked-prompt';
import { Skeleton } from '@/components/ui/skeleton';
import { isAtLeastTier } from '@/lib/plan-features';
import { useOrgSettings } from '@/hooks/use-org-settings';
import { getMoodEmoji } from '@/lib/getMoodEmoji';
import { convexQuery } from '@convex-dev/react-query';
import { api } from 'convex/_generated/api';
import { useSuspenseQuery } from '@tanstack/react-query';
import { ShieldAlert, Users } from 'lucide-react';
import numeral from 'numeral';

export const Route = createFileRoute('/org/$slug/_authenticated/trends')({
  component: () => (
    <Suspense fallback={<TrendsSkeleton />}>
      <Trends />
    </Suspense>
  ),
});

function TrendsSkeleton() {
  return (
    <div className="flex flex-col">
      <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton className="h-9 w-64" />
            <Skeleton className="h-5 w-96" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Skeleton className="col-span-4 h-[350px]" />
          <Skeleton className="col-span-3 h-[350px]" />
        </div>
      </div>
    </div>
  );
}

/**
 * Privacy notice shown when not enough contributors are logging moods.
 * Prevents de-anonymization in small orgs.
 */
function PrivacyNotice({ contributorCount }: { contributorCount: number }) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <ShieldAlert className="mb-4 h-12 w-12 text-muted-foreground" />
        <h3 className="mb-2 text-lg font-semibold">
          Not enough data to show trends
        </h3>
        <p className="mb-1 max-w-md text-sm text-muted-foreground">
          To protect individual privacy, org-wide trends require at least 3
          people to log their mood. Currently{' '}
          <strong>
            {contributorCount}{' '}
            {contributorCount === 1 ? 'person has' : 'people have'}
          </strong>{' '}
          logged today.
        </p>
        <p className="text-sm text-muted-foreground">
          Encourage your team to log their mood and check back soon.
        </p>
      </CardContent>
    </Card>
  );
}

function Trends() {
  const { slug } = useParams({ strict: false });
  const { orgSettings } = useOrgSettings();
  const organizationId = orgSettings.clerkOrgId ?? '';

  // Check if global trends are enabled for this org's plan
  const globalTrendsEnabled =
    orgSettings.featureFlags?.globalTrendsEnabled ??
    isAtLeastTier(orgSettings.plan, 'team');

  if (!globalTrendsEnabled) {
    return (
      <FeatureLockedPrompt
        featureName="Global Mood Dashboard"
        description="View organization-wide mood trends, see how everyone is feeling, and explore collective mood patterns."
        requiredTier="team"
        currentPlan={orgSettings.plan}
        slug={slug ?? ''}
      />
    );
  }

  // Fetch org-wide data
  const { data: orgStats } = useSuspenseQuery(
    convexQuery(api.mood.getOrgMoodStats, { organizationId })
  );

  const { data: orgDistribution } = useSuspenseQuery(
    convexQuery(api.mood.getOrgMoodDistribution, { organizationId })
  );

  const { data: orgTimeline } = useSuspenseQuery(
    convexQuery(api.mood.getOrgMoodTimeline, {
      organizationId,
      usersTimeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    })
  );

  const meetsPrivacy = orgStats.meetsPrivacyThreshold;

  return (
    <div className="flex flex-col">
      <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              Global Mood Dashboard
            </h2>
            <p className="text-muted-foreground">
              See how everyone is feeling today and explore mood trends
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild>
              <Link to="/org/$slug/log" params={{ slug: slug ?? '' }}>
                Log Your Mood
              </Link>
            </Button>
          </div>
        </div>

        <Tabs defaultValue="today" className="space-y-4">
          <div className="flex justify-between">
            <TabsList>
              <TabsTrigger value="today">Today</TabsTrigger>
              <TabsTrigger value="week">This Week</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="today" className="space-y-4">
            {/* Summary cards -- always show counts, but gate detailed info on privacy */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Moods Logged Today
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {numeral(orgStats.totalMoodsToday).format('0,0')}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    From {orgStats.contributorCount}{' '}
                    {orgStats.contributorCount === 1
                      ? 'contributor'
                      : 'contributors'}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Most Common Mood
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {meetsPrivacy && orgStats.mostCommonMood ? (
                    <>
                      <div className="text-2xl font-bold">
                        {getMoodEmoji(orgStats.mostCommonMood)}{' '}
                        {orgStats.mostCommonMood.charAt(0).toUpperCase() +
                          orgStats.mostCommonMood.slice(1)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {orgStats.mostCommonMoodPercent}% of all moods
                      </p>
                    </>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      Needs more data
                    </div>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Privacy Status
                  </CardTitle>
                  <ShieldAlert className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {meetsPrivacy ? (
                    <>
                      <div className="text-2xl font-bold text-green-600">
                        Active
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Enough contributors for anonymous trends
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="text-2xl font-bold text-amber-500">
                        Waiting
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Need {3 - orgStats.contributorCount} more{' '}
                        {3 - orgStats.contributorCount === 1
                          ? 'contributor'
                          : 'contributors'}
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Charts -- only render when privacy threshold is met */}
            {meetsPrivacy ? (
              <>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                  <Card className="col-span-full lg:col-span-4">
                    <CardHeader>
                      <CardTitle>Mood Distribution</CardTitle>
                      <CardDescription>
                        How everyone is feeling today
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                      <MoodPieChart data={orgDistribution.distribution} />
                    </CardContent>
                  </Card>
                  <Card className="col-span-full lg:col-span-3">
                    <CardHeader>
                      <CardTitle>Participation</CardTitle>
                      <CardDescription>
                        Who's logging their mood
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col items-center justify-center py-8">
                        <Users className="mb-4 h-12 w-12 text-muted-foreground/50" />
                        <div className="text-4xl font-bold">
                          {orgStats.contributorCount}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          people logged today
                        </p>
                        <p className="mt-2 text-xs text-muted-foreground">
                          {orgStats.totalMoodsToday} total entries
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            ) : (
              <PrivacyNotice contributorCount={orgStats.contributorCount} />
            )}
          </TabsContent>

          <TabsContent value="week" className="space-y-4">
            {orgTimeline.meetsPrivacyThreshold ? (
              <Card>
                <CardHeader>
                  <CardTitle>7-Day Mood Timeline</CardTitle>
                  <CardDescription>
                    How the organization's mood has changed over the past week
                  </CardDescription>
                </CardHeader>
                <CardContent className="pl-2">
                  <MoodTimeline data={orgTimeline.timeline} />
                </CardContent>
              </Card>
            ) : (
              <PrivacyNotice contributorCount={orgStats.contributorCount} />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
