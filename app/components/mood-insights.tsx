import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function MoodInsights() {
  return (
    <Tabs defaultValue="patterns">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="patterns">Patterns</TabsTrigger>
        <TabsTrigger value="triggers">Triggers</TabsTrigger>
        <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
      </TabsList>

      <TabsContent value="patterns" className="mt-4 space-y-4">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-lg">Weekly Patterns</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  You tend to feel more stressed on Mondays and Tuesdays, with
                  happiness increasing toward the weekend.
                </p>
              </div>

              <div>
                <h3 className="font-medium text-lg">Time of Day</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Your mood is typically more positive in the mornings and
                  evenings, with a dip in the afternoon.
                </p>
              </div>

              <div>
                <h3 className="font-medium text-lg">Monthly Trends</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Your overall happiness has increased by 15% compared to last
                  month.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="triggers" className="mt-4 space-y-4">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-lg">Positive Triggers</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Based on your notes, activities like "exercise", "family
                  time", and "reading" are associated with positive moods.
                </p>
              </div>

              <div>
                <h3 className="font-medium text-lg">Negative Triggers</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Words like "deadline", "meeting", and "traffic" appear
                  frequently in your notes on days when you feel stressed.
                </p>
              </div>

              <div>
                <h3 className="font-medium text-lg">Correlation Analysis</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  There's a strong correlation between your sleep quality and
                  mood the following day.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="suggestions" className="mt-4 space-y-4">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-lg">Mood Improvement</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Consider scheduling short breaks on Monday and Tuesday
                  afternoons to reduce stress levels.
                </p>
              </div>

              <div>
                <h3 className="font-medium text-lg">Activity Suggestions</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Based on your patterns, activities like morning exercise and
                  evening reading might help maintain positive moods.
                </p>
              </div>

              <div>
                <h3 className="font-medium text-lg">Group Insights</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Your "Work Team" group shows similar stress patterns. Consider
                  discussing workload distribution with your team.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
