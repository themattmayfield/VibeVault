import { createFileRoute, Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
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

export const Route = createFileRoute('/_authenticated/dashboard')({
  component: Home,
});

function Home() {
  return (
    <div className="flex flex-col">
      <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              Your Mood Dashboard
            </h2>
            <p className="text-muted-foreground">
              Track your emotional patterns and insights
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild>
              <Link to="/log">Log New Mood</Link>
            </Button>
          </div>
        </div>

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
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Current Streak
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">7 days</div>
                  <p className="text-xs text-muted-foreground">Keep it up!</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Most Common Mood
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">Happy</div>
                  <p className="text-xs text-muted-foreground">Last 30 days</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Entries
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">42</div>
                  <p className="text-xs text-muted-foreground">
                    Since you started
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Mood Today
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">Excited</div>
                  <p className="text-xs text-muted-foreground">
                    Logged at 9:30 AM
                  </p>
                </CardContent>
              </Card>
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
