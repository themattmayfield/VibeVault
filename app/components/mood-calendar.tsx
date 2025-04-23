import { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from 'convex/_generated/api';
import { useSuspenseQuery } from '@tanstack/react-query';
import { useLoaderData } from '@tanstack/react-router';
import { convexQuery } from '@convex-dev/react-query';

const moodColors: Record<string, string> = {
  happy: 'bg-green-500',
  excited: 'bg-yellow-500',
  calm: 'bg-blue-500',
  neutral: 'bg-gray-500',
  tired: 'bg-purple-500',
  stressed: 'bg-orange-500',
  sad: 'bg-indigo-500',
  angry: 'bg-red-500',
};

const moodEmojis: Record<string, string> = {
  happy: '😊',
  excited: '😃',
  calm: '😌',
  neutral: '😐',
  tired: '😴',
  stressed: '😰',
  sad: '😢',
  angry: '😠',
};

export function MoodCalendar() {
  const { user } = useLoaderData({
    from: '/_authenticated',
  });
  const { data: moodData } = useSuspenseQuery(
    convexQuery(api.mood.getUserMoods, {
      neonUserId: user.id,
    })
  );
  console.log(moodData);

  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedMoods, setSelectedMoods] = useState<Array<{
    id: string;
    mood: string;
    note: string;
    time: string;
    tags?: string[];
  }> | null>(null);
  const [currentMoodIndex, setCurrentMoodIndex] = useState(0);

  // Function to handle date selection
  const handleSelect = (newDate: Date | undefined) => {
    setDate(newDate);
    if (newDate) {
      const dateStr = newDate.toISOString().split('T')[0];
      const moods = moodData[dateStr] || null;
      setSelectedMoods(moods);
      setCurrentMoodIndex(0); // Reset to first mood when selecting a new date
    } else {
      setSelectedMoods(null);
    }
  };

  // Navigate between moods for the selected day
  const nextMood = () => {
    if (selectedMoods && currentMoodIndex < selectedMoods.length - 1) {
      setCurrentMoodIndex(currentMoodIndex + 1);
    }
  };

  const prevMood = () => {
    if (selectedMoods && currentMoodIndex > 0) {
      setCurrentMoodIndex(currentMoodIndex - 1);
    }
  };

  // Get the dominant mood for a day (for the calendar indicator)
  const getDominantMood = (dateStr: string) => {
    const moods = moodData[dateStr];
    if (!moods || moods.length === 0) return null;

    // For simplicity, we'll use the most recent mood as dominant
    // In a real app, you might use a more sophisticated algorithm
    return moods[moods.length - 1].mood;
  };

  return (
    <div className="flex flex-col md:flex-row gap-4">
      <Calendar
        mode="single"
        selected={date}
        onSelect={handleSelect}
        className="border rounded-md"
        modifiers={{
          booked: (date) => {
            const dateStr = date.toISOString().split('T')[0];
            return dateStr in moodData;
          },
        }}
        modifiersStyles={{
          booked: { fontWeight: 'bold' },
        }}
        components={{
          DayContent: ({ date, ...props }) => {
            const dateStr = date.toISOString().split('T')[0];
            const moodEntries = moodData[dateStr];
            const dominantMood = getDominantMood(dateStr);

            return (
              <div
                {...props}
                onClick={() => handleSelect(date)}
                className="relative w-full h-full flex items-center justify-center"
              >
                {date.getDate()}
                {moodEntries && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex gap-0.5">
                    {/* Show a single dot for the dominant mood */}
                    {dominantMood && (
                      <div
                        className={cn(
                          'w-3 h-3 rounded-full',
                          moodColors[dominantMood]
                        )}
                      />
                    )}

                    {/* Show a small indicator if there are multiple entries */}
                    {moodEntries && moodEntries.length > 1 && (
                      <div className="absolute -right-2 -top-1 w-2 h-2 bg-primary rounded-full" />
                    )}
                  </div>
                )}
              </div>
            );
          },
        }}
      />

      <Card className="flex-1">
        <CardContent className="p-4">
          {selectedMoods && selectedMoods.length > 0 ? (
            <div className="space-y-4">
              {/* Navigation controls for multiple moods */}
              {selectedMoods.length > 1 && (
                <div className="flex items-center justify-between mb-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={prevMood}
                    disabled={currentMoodIndex === 0}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm">
                    {currentMoodIndex + 1} of {selectedMoods.length} entries
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={nextMood}
                    disabled={currentMoodIndex === selectedMoods.length - 1}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {/* Current mood display */}
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center text-2xl',
                    moodColors[selectedMoods[currentMoodIndex].mood]
                  )}
                >
                  {moodEmojis[selectedMoods[currentMoodIndex].mood]}
                </div>
                <div>
                  <h3 className="font-medium text-lg capitalize">
                    {selectedMoods[currentMoodIndex].mood}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedMoods[currentMoodIndex].time}
                  </p>
                </div>
              </div>

              <div className="bg-muted/50 p-3 rounded-lg">
                <p className="text-sm">
                  {selectedMoods[currentMoodIndex].note}
                </p>
              </div>

              <p className="text-xs text-muted-foreground">
                {date?.toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>

              {/* Tags */}
              {selectedMoods[currentMoodIndex].tags &&
                selectedMoods[currentMoodIndex].tags!.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {selectedMoods[currentMoodIndex].tags!.map((tag, i) => (
                      <div
                        key={i}
                        className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full"
                      >
                        #{tag}
                      </div>
                    ))}
                  </div>
                )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
              <div className="text-4xl mb-2">📅</div>
              {date
                ? 'No mood logged for this date'
                : 'Select a date to view mood details'}
              <p className="text-sm mt-2">
                You can log a mood for this day by clicking the "Log Mood"
                button
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
