import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MoodPieChart } from "@/components/mood-pie-chart";
import { MoodWordCloud } from "@/components/mood-word-cloud";
import { MoodTimeline } from "@/components/mood-timeline";

export const Route = createFileRoute("/index copy")({
  component: Home,
});

function Home() {
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
              <Link to="/log">Log Your Mood</Link>
            </Button>
          </div>
        </div>

        <Tabs defaultValue="today" className="space-y-4">
          <div className="flex justify-between">
            <TabsList>
              <TabsTrigger value="today">Today</TabsTrigger>
              <TabsTrigger value="week">This Week</TabsTrigger>
              <TabsTrigger value="month">This Month</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="today" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Moods Logged
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">1,284</div>
                  <p className="text-xs text-muted-foreground">
                    +24% from yesterday
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
                  <div className="text-2xl font-bold">Happy</div>
                  <p className="text-xs text-muted-foreground">
                    42% of all moods
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Active Groups
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">342</div>
                  <p className="text-xs text-muted-foreground">+18 new today</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Trending Tag
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">#weekend</div>
                  <p className="text-xs text-muted-foreground">
                    Used in 128 mood logs
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              <Card className="col-span-4">
                <CardHeader>
                  <CardTitle>Mood Distribution</CardTitle>
                  <CardDescription>
                    How everyone is feeling today
                  </CardDescription>
                </CardHeader>
                <CardContent className="pl-2">
                  <MoodPieChart />
                </CardContent>
              </Card>
              <Card className="col-span-3">
                <CardHeader>
                  <CardTitle>Popular Tags</CardTitle>
                  <CardDescription>Most used tags in mood logs</CardDescription>
                </CardHeader>
                <CardContent>
                  <MoodWordCloud />
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4">
              <Card className="col-span-4">
                <CardHeader>
                  <CardTitle>Mood Timeline</CardTitle>
                  <CardDescription>
                    How moods have changed throughout the day
                  </CardDescription>
                </CardHeader>
                <CardContent className="pl-2">
                  <MoodTimeline />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="week" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Weekly Mood Trends</CardTitle>
                <CardDescription>
                  View mood patterns over the past week
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Weekly mood data would be displayed here
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="month" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Mood Trends</CardTitle>
                <CardDescription>
                  View mood patterns over the past month
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Monthly mood data would be displayed here
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
