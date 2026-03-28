import { Suspense } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { MoodCalendar } from '@/components/mood-calendar';

export const Route = createFileRoute('/tenant/_authenticated/calendar')({
  component: () => (
    <Suspense fallback={<CalendarSkeleton />}>
      <CalendarPage />
    </Suspense>
  ),
});

function CalendarPage() {
  return (
    <div className="flex flex-col">
      <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Mood Calendar</h2>
          <p className="text-muted-foreground">
            View your mood patterns on a calendar
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <MoodCalendar />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function CalendarSkeleton() {
  return (
    <div className="flex flex-col">
      <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
        <div>
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-5 w-72 mt-2" />
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <Skeleton className="h-[300px] w-[280px] rounded-md" />
              <Skeleton className="h-[300px] flex-1 rounded-md" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
