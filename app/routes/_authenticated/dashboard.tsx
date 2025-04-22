import { createFileRoute } from '@tanstack/react-router';
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
import { getMoodEmoji } from '@/lib/getMoodEmoji';
import { useSuspenseQuery } from '@tanstack/react-query';
import { api } from 'convex/_generated/api';
import { convexQuery } from '@convex-dev/react-query';

export const Route = createFileRoute('/_authenticated/dashboard')({
  component: Home,
});

function Home() {
  const { data: totalMoodEntries } = useSuspenseQuery(
    convexQuery(api.mood.getUsersTotalMoodEntries, {})
  );

  console.log(totalMoodEntries);

  const dashboardCards = [
    {
      title: 'Current Streak',
      value: '7 days',
      description: 'Keep it up!',
    },
    {
      title: 'Most Common Mood',
      value: 'Happy',
      description: 'Last 30 days',
    },
    {
      title: 'Total Entries',
      value: totalMoodEntries,
      description: 'Since you started',
    },
    {
      title: 'Mood Today',
      value: 'Excited',
      description: 'Logged at 9:30 AM',
    },
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
                    Your mood patterns over the past 30 days
                  </CardDescription>
                </CardHeader>
                <CardContent className="pl-2">
                  <PersonalMoodChart />
                </CardContent>
              </Card>
              <Card className="col-span-3">
                <CardHeader>
                  <CardTitle>Recent Entries</CardTitle>
                  <CardDescription>Your last 5 mood logs</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      {
                        date: 'Today, 9:30 AM',
                        mood: 'Excited',
                        note: 'Starting a new project!',
                      },
                      {
                        date: 'Yesterday, 8:15 PM',
                        mood: 'Calm',
                        note: 'Evening meditation helped',
                      },
                      {
                        date: '2 days ago, 12:30 PM',
                        mood: 'Stressed',
                        note: 'Deadline approaching',
                      },
                      {
                        date: '3 days ago, 10:00 AM',
                        mood: 'Happy',
                        note: 'Great team meeting',
                      },
                      {
                        date: '4 days ago, 7:45 PM',
                        mood: 'Tired',
                        note: 'Long day at work',
                      },
                    ].map((entry, i) => (
                      <div key={i} className="flex items-start space-x-4">
                        <div className="min-w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          {getMoodEmoji(entry.mood)}
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium leading-none">
                            {entry.mood}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {entry.note}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {entry.date}
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
