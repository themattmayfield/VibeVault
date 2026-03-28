import { Suspense } from 'react';
import { createFileRoute, useLoaderData, Link } from '@tanstack/react-router';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PersonalMoodChart } from '@/components/personal-mood-chart';
import { getMoodEmoji, moodOptions } from '@/lib/getMoodEmoji';
import { convexQuery } from '@convex-dev/react-query';
import { api } from 'convex/_generated/api';
import { useSuspenseQuery } from '@tanstack/react-query';
import { CalendarDays, Lightbulb, ArrowRight } from 'lucide-react';
import numeral from 'numeral';
import pluralize from 'pluralize';
import { useOrgSettings } from '@/hooks/use-org-settings';

export const Route = createFileRoute('/org/$slug/_authenticated/dashboard')({
  component: () => (
    <Suspense fallback={<DashboardSkeleton />}>
      <Home />
    </Suspense>
  ),
});

function Home() {
  const { slug } = Route.useParams();
  const user = useLoaderData({
    from: '/org/$slug/_authenticated',
  });
  const { orgSettings } = useOrgSettings();
  const organizationId = orgSettings.betterAuthOrgId;

  const { data: totalMoodEntries } = useSuspenseQuery(
    convexQuery(api.mood.getUsersTotalMoodEntries, {
      userId: user._id,
      organizationId,
    })
  );
  const { data: currentStreak } = useSuspenseQuery(
    convexQuery(api.mood.getUsersCurrentStreak, {
      userId: user._id,
      organizationId,
    })
  );
  const { data: mostCommonMood } = useSuspenseQuery(
    convexQuery(api.mood.getMostCommonMoodLast30Days, {
      userId: user._id,
      organizationId,
    })
  );

  const { data: moodToday } = useSuspenseQuery(
    convexQuery(api.mood.getMoodToday, {
      userId: user._id,
      organizationId,
    })
  );

  const { data: lastFiveMoods } = useSuspenseQuery(
    convexQuery(api.mood.getLastFiveMoods, {
      userId: user._id,
      organizationId,
    })
  );

  const mostCommonMoodLabel =
    moodOptions.find((mood) => mood.value === mostCommonMood?.moods[0].mood)
      ?.label ?? '';

  const moodTodayLabel =
    moodOptions.find((mood) => mood.value === moodToday?.mood)?.label ?? '';
  const moodTodayDate = new Date(moodToday?._creationTime).toLocaleTimeString(
    'en-US',
    {
      hour: 'numeric',
      minute: '2-digit',
    }
  );

  const dashboardCards = [
    {
      title: 'Current Streak',
      value: `${numeral(currentStreak).format('0,0')} ${pluralize(
        'day',
        currentStreak
      )}`,
      description:
        currentStreak > 0 ? 'Keep it up!' : 'Log a mood to start your streak!',
    },
    ...(mostCommonMoodLabel
      ? [
          {
            title: 'Most Common Mood',
            value: mostCommonMoodLabel,
            description: 'Last 30 days',
          },
        ]
      : []),
    {
      title: 'Total Entries',
      value: numeral(totalMoodEntries).format('0,0'),
      description: 'Since you started',
    },
    ...(moodTodayLabel
      ? [
          {
            title: 'Mood Today',
            value: moodTodayLabel,
            description: `Logged at ${moodTodayDate}`,
          },
        ]
      : []),
  ];

  return (
    <div className="flex flex-col">
      <div className="flex-1 space-y-4 px-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {dashboardCards.map((card) => (
            <DashboardCard key={card.title} {...card} />
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Mood Trends</CardTitle>
              <CardDescription>
                Your mood patterns over the past 2 weeks
              </CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <Suspense fallback={<Skeleton className="h-[300px] w-full" />}>
                <PersonalMoodChart />
              </Suspense>
            </CardContent>
          </Card>
          <Card className="col-span-4 md:col-span-3">
            <CardHeader>
              <CardTitle>Recent Entries</CardTitle>
              <CardDescription>Your last 5 mood logs</CardDescription>
            </CardHeader>
            <CardContent>
              {lastFiveMoods && lastFiveMoods.length > 0 ? (
                <div className="space-y-4">
                  {lastFiveMoods.map((entry, i) => (
                    <div key={i} className="flex items-start space-x-4">
                      <div className="min-w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        {getMoodEmoji(entry.mood)}
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {
                            moodOptions.find(
                              (mood) => mood.value === entry.mood
                            )?.label
                          }
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {entry.note}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {entry.relativeTime}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="text-4xl mb-3">
                    <CalendarDays className="h-10 w-10 text-muted-foreground/50" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    No mood entries yet
                  </p>
                  <p className="text-xs text-muted-foreground/70 mb-4 max-w-[200px]">
                    Start tracking how you feel to see your entries here
                  </p>
                  <Link
                    to="/org/$slug/log"
                    params={{ slug }}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                  >
                    Log your first mood
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Link to="/org/$slug/calendar" params={{ slug }} className="group">
            <Card className="transition-colors hover:border-primary/50">
              <CardHeader className="flex flex-row items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <CalendarDays className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-base">Mood Calendar</CardTitle>
                  <CardDescription>
                    View your mood patterns on a calendar
                  </CardDescription>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
              </CardHeader>
            </Card>
          </Link>
          <Link to="/org/$slug/insights" params={{ slug }} className="group">
            <Card className="transition-colors hover:border-primary/50">
              <CardHeader className="flex flex-row items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Lightbulb className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-base">Mood Insights</CardTitle>
                  <CardDescription>
                    Discover what drives your moods
                  </CardDescription>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
              </CardHeader>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}

const DashboardCard = ({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description: string;
}) => {
  return (
    <Card className="py-2 sm:py-4 gap-3">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
};

function DashboardCardSkeleton() {
  return (
    <Card className="py-2 sm:py-4 gap-3">
      <CardHeader>
        <Skeleton className="h-4 w-28" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-7 w-20 mb-1" />
        <Skeleton className="h-3 w-24" />
      </CardContent>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col">
      <div className="flex-1 space-y-4 px-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <DashboardCardSkeleton />
          <DashboardCardSkeleton />
          <DashboardCardSkeleton />
          <DashboardCardSkeleton />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <Skeleton className="h-6 w-28" />
              <Skeleton className="h-4 w-64 mt-1" />
            </CardHeader>
            <CardContent className="pl-2">
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>
          <Card className="col-span-4 md:col-span-3">
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-40 mt-1" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-start space-x-4">
                    <Skeleton className="min-w-10 h-10 rounded-full" />
                    <div className="space-y-1 flex-1">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
