import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useLoaderData } from '@tanstack/react-router';
import { useMoodInsights } from '../hooks/use-mood-insights';

interface MoodInsightsSectionProps {
  title: string;
  insight: string;
  isLoading: boolean;
}

const MoodInsightsSection = ({
  title,
  insight,
  isLoading,
}: MoodInsightsSectionProps) => {
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

interface InsightTabContentProps {
  insights: Record<string, string>;
  isLoading: boolean;
  sections: Array<{ title: string; key: string }>;
}

const InsightTabContent = ({
  insights,
  isLoading,
  sections,
}: InsightTabContentProps) => (
  <Card>
    <CardContent className="pt-6">
      <div className="space-y-4">
        {sections.map(({ title, key }) => (
          <MoodInsightsSection
            key={key}
            title={title}
            insight={insights?.[key] || ''}
            isLoading={isLoading}
          />
        ))}
      </div>
    </CardContent>
  </Card>
);

export function MoodInsights() {
  const user = useLoaderData({
    from: '/_organization/_authenticated',
  });

  const { patterns, triggers, suggestions } = useMoodInsights({
    userId: user._id,
  });

  return (
    <Tabs defaultValue="patterns">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="patterns">Patterns</TabsTrigger>
        <TabsTrigger value="triggers">Triggers</TabsTrigger>
        <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
      </TabsList>

      <TabsContent value="patterns" className="mt-4 space-y-4">
        <InsightTabContent
          insights={patterns.data}
          isLoading={patterns.isLoading}
          sections={[
            { title: 'Weekly Patterns', key: 'weeklyPatterns' },
            { title: 'Time of Day', key: 'timeOfDay' },
            { title: 'Monthly Trends', key: 'monthlyTrends' },
          ]}
        />
      </TabsContent>

      <TabsContent value="triggers" className="mt-4 space-y-4">
        <InsightTabContent
          insights={triggers.data}
          isLoading={triggers.isLoading}
          sections={[
            { title: 'Positive Triggers', key: 'positiveTriggers' },
            { title: 'Negative Triggers', key: 'negativeTriggers' },
            { title: 'Correlation Analysis', key: 'correlationAnalysis' },
          ]}
        />
      </TabsContent>

      <TabsContent value="suggestions" className="mt-4 space-y-4">
        <InsightTabContent
          insights={suggestions.data}
          isLoading={suggestions.isLoading}
          sections={[
            { title: 'Mood Improvement', key: 'moodImprovement' },
            { title: 'Activity Suggestions', key: 'activitySuggestions' },
            { title: 'Group Insights', key: 'groupInsights' },
          ]}
        />
      </TabsContent>
    </Tabs>
  );
}

export default MoodInsights;
