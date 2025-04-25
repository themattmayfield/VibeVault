import { queryOptions, useQuery } from '@tanstack/react-query';
import { useSuspenseQuery } from '@tanstack/react-query';
import { convexQuery, useConvexMutation } from '@convex-dev/react-query';
import { api } from 'convex/_generated/api';
import {
  getPatterns,
  getTriggers,
  getSuggestions,
} from '../actions/getInsights';
import type { Id } from 'convex/_generated/dataModel';

export function useMoodInsights({ userId }: { userId: Id<'users'> }) {
  const createInsight = useConvexMutation(api.insights.createInsight);

  const { data: moods } = useSuspenseQuery(
    convexQuery(api.mood.getUserLast30DaysMoods, {
      userId,
    })
  );

  // Patterns
  const { data: todaysPatterns } = useSuspenseQuery(
    convexQuery(api.insights.getTodaysInsight, {
      table: 'patterns' as const,
      userId,
    })
  );

  const { data: patterns, isLoading: patternsLoading } = useQuery(
    queryOptions({
      enabled: !todaysPatterns,
      queryKey: ['patterns'],
      queryFn: async () => {
        const result = await getPatterns({
          data: {
            moods,
            usersTimeZone: 'America/New_York',
          },
        });

        if (result && !todaysPatterns) {
          await createInsight({
            table: 'patterns',
            content: JSON.stringify(result),
            userId,
          });
        }

        return result;
      },
      staleTime: 24 * 60 * 60 * 1000, // Cache for 24 hours
    })
  );

  // Triggers
  const { data: todaysTriggers } = useSuspenseQuery(
    convexQuery(api.insights.getTodaysInsight, {
      table: 'triggers' as const,
      userId,
    })
  );

  const { data: triggers, isLoading: triggersLoading } = useQuery(
    queryOptions({
      enabled: !todaysTriggers,
      queryKey: ['triggers'],
      queryFn: async () => {
        const result = await getTriggers({
          data: {
            moods,
            usersTimeZone: 'America/New_York',
          },
        });

        if (result && !todaysTriggers) {
          await createInsight({
            table: 'triggers',
            content: JSON.stringify(result),
            userId,
          });
        }

        return result;
      },
      staleTime: 24 * 60 * 60 * 1000, // Cache for 24 hours
    })
  );

  // Suggestions
  const { data: todaysSuggestions } = useSuspenseQuery(
    convexQuery(api.insights.getTodaysInsight, {
      table: 'suggestions' as const,
      userId,
    })
  );

  const { data: suggestions, isLoading: suggestionsLoading } = useQuery(
    queryOptions({
      enabled: !todaysSuggestions,
      queryKey: ['suggestions'],
      queryFn: async () => {
        const result = await getSuggestions({
          data: {
            moods,
            usersTimeZone: 'America/New_York',
          },
        });

        if (result && !todaysSuggestions) {
          await createInsight({
            table: 'suggestions',
            content: JSON.stringify(result),
            userId,
          });
        }

        return result;
      },
      staleTime: 24 * 60 * 60 * 1000, // Cache for 24 hours
    })
  );

  return {
    patterns: {
      data: todaysPatterns
        ? JSON.parse(todaysPatterns?.insight || '{}')
        : patterns,
      isLoading: patternsLoading,
    },
    triggers: {
      data: todaysTriggers
        ? JSON.parse(todaysTriggers?.insight || '{}')
        : triggers,
      isLoading: triggersLoading,
    },
    suggestions: {
      data: todaysSuggestions
        ? JSON.parse(todaysSuggestions?.insight || '{}')
        : suggestions,
      isLoading: suggestionsLoading,
    },
  };
}
