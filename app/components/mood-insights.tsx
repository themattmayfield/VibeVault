import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  getPatterns,
  getTriggers,
  getSuggestions,
} from '../actions/getInsights';
import { queryOptions, useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from 'convex/_generated/api';
import { useSuspenseQuery } from '@tanstack/react-query';
import { convexQuery } from '@convex-dev/react-query';
import { useLoaderData } from '@tanstack/react-router';

export function MoodInsights() {
  const { user } = useLoaderData({
    from: '/_authenticated',
  });
  const { data: moods } = useSuspenseQuery(
    convexQuery(api.mood.getUserLast30DaysMoods, {
      neonUserId: user.id,
    })
  );

  const { data: insights, isLoading: patternsLoading } = useQuery(
    queryOptions({
      queryKey: ['insights'],
      queryFn: () =>
        getPatterns({
          data: {
            moods,
            usersTimeZone: 'America/New_York',
          },
        }),
      staleTime: 24 * 60 * 60 * 1000, // Cache for 24 hours
    })
  );

  const { data: triggers, isLoading: triggersLoading } = useQuery(
    queryOptions({
      queryKey: ['triggers'],
      queryFn: () =>
        getTriggers({
          data: {
            moods,
            usersTimeZone: 'America/New_York',
          },
        }),
      staleTime: 24 * 60 * 60 * 1000, // Cache for 24 hours
    })
  );

  const { data: suggestions, isLoading: suggestionsLoading } = useQuery(
    queryOptions({
      queryKey: ['suggestions'],
      queryFn: () =>
        getSuggestions({
          data: {
            moods,
            usersTimeZone: 'America/New_York',
          },
        }),
      staleTime: 24 * 60 * 60 * 1000, // Cache for 24 hours
    })
  );

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
              <MoodInsightsComponent
                title="Weekly Patterns"
                insight={insights?.weeklyPatterns || ''}
                isLoading={patternsLoading}
              />
              <MoodInsightsComponent
                title="Time of Day"
                insight={insights?.timeOfDay || ''}
                isLoading={patternsLoading}
              />
              <MoodInsightsComponent
                title="Monthly Trends"
                insight={insights?.monthlyTrends || ''}
                isLoading={patternsLoading}
              />
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="triggers" className="mt-4 space-y-4">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <MoodInsightsComponent
                title="Positive Triggers"
                insight={triggers?.positiveTriggers || ''}
                isLoading={triggersLoading}
              />
              <MoodInsightsComponent
                title="Negative Triggers"
                insight={triggers?.negativeTriggers || ''}
                isLoading={triggersLoading}
              />
              <MoodInsightsComponent
                title="Correlation Analysis"
                insight={triggers?.correlationAnalysis || ''}
                isLoading={triggersLoading}
              />
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="suggestions" className="mt-4 space-y-4">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <MoodInsightsComponent
                title="Mood Improvement"
                insight={suggestions?.moodImprovement || ''}
                isLoading={suggestionsLoading}
              />
              <MoodInsightsComponent
                title="Activity Suggestions"
                insight={suggestions?.activitySuggestions || ''}
                isLoading={suggestionsLoading}
              />
              <MoodInsightsComponent
                title="Group Insights"
                insight={suggestions?.groupInsights || ''}
                isLoading={suggestionsLoading}
              />
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

const MoodInsightsComponent = ({
  title,
  insight,
  isLoading,
}: {
  title: string;
  insight: string;
  isLoading: boolean;
}) => {
  return (
    <div>
      <h3 className="font-medium text-lg">{title}</h3>
      {isLoading ? (
        <div className="space-y-2 mt-1">
          <Skeleton
            className="h-4"
            style={{ width: `${Math.floor(50 + Math.random() * 50)}%` }}
          />
          <Skeleton
            className="h-4"
            style={{ width: `${Math.floor(50 + Math.random() * 50)}%` }}
          />
        </div>
      ) : (
        <p className="text-sm text-muted-foreground mt-1">{insight}</p>
      )}
    </div>
  );
};

export default MoodInsightsComponent;
