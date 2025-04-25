import { createFileRoute, useLoaderData } from '@tanstack/react-router';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MoodCalendar } from '@/components/mood-calendar';
import { PersonalMoodChart } from '@/components/personal-mood-chart';
import { MoodInsights } from '@/components/mood-insights';
import { getMoodEmoji, moodOptions } from '@/lib/getMoodEmoji';
import { convexQuery } from '@convex-dev/react-query';
import { api } from 'convex/_generated/api';
import { useSuspenseQuery } from '@tanstack/react-query';
import numeral from 'numeral';
import pluralize from 'pluralize';

export const Route = createFileRoute('/_authenticated/dashboard')({
  component: Home,
});

function Home() {
  const { user } = useLoaderData({
    from: '/_authenticated',
  });
  const { data: totalMoodEntries } = useSuspenseQuery(
    convexQuery(api.mood.getUsersTotalMoodEntries, {
      neonUserId: user.id,
    })
  );
  const { data: currentStreak } = useSuspenseQuery(
    convexQuery(api.mood.getUsersCurrentStreak, {
      neonUserId: user.id,
    })
  );
  const { data: mostCommonMood } = useSuspenseQuery(
    convexQuery(api.mood.getMostCommonMoodLast30Days, {
      neonUserId: user.id,
    })
  );

  const { data: moodToday } = useSuspenseQuery(
    convexQuery(api.mood.getMoodToday, {
      neonUserId: user.id,
    })
  );

  const { data: lastFiveMoods } = useSuspenseQuery(
    convexQuery(api.mood.getLastFiveMoods, {
      neonUserId: user.id,
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
      description: 'Keep it up!',
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
        <Tabs defaultValue="overview" className="space-y-4">
          <div className="flex justify-between">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="calendar">Calendar</TabsTrigger>
              <TabsTrigger value="insights">Insights</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="space-y-4">
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
                  <PersonalMoodChart />
                </CardContent>
              </Card>
              <Card className="col-span-4 md:col-span-3">
                <CardHeader>
                  <CardTitle>Recent Entries</CardTitle>
                  <CardDescription>Your last 5 mood logs</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {lastFiveMoods?.map((entry, i) => (
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
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="calendar" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Mood Calendar</CardTitle>
                <CardDescription>
                  View your mood patterns on a calendar
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MoodCalendar />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="insights" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Mood Insights</CardTitle>
                <CardDescription>
                  AI-powered analysis of your mood patterns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MoodInsights />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

const DashboardCard = ({
  title,
  value,
  description,
}: { title: string; value: string; description: string }) => {
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
