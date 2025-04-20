import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// Mock data for mood entries
const moodData: Record<string, { mood: string; note: string }> = {
  "2023-04-01": { mood: "happy", note: "Great day at work!" },
  "2023-04-03": { mood: "stressed", note: "Deadline approaching" },
  "2023-04-05": { mood: "excited", note: "Weekend plans!" },
  "2023-04-07": { mood: "tired", note: "Didn't sleep well" },
  "2023-04-10": { mood: "calm", note: "Meditation session" },
  "2023-04-12": { mood: "sad", note: "Bad news" },
  "2023-04-15": { mood: "angry", note: "Argument with colleague" },
  "2023-04-18": { mood: "happy", note: "Project completed!" },
  "2023-04-20": { mood: "neutral", note: "Regular day" },
  "2023-04-22": { mood: "excited", note: "Birthday party" },
  "2023-04-25": { mood: "calm", note: "Relaxing day" },
  "2023-04-28": { mood: "happy", note: "Good feedback" },
};

const moodColors: Record<string, string> = {
  happy: "bg-green-500",
  excited: "bg-yellow-500",
  calm: "bg-blue-500",
  neutral: "bg-gray-500",
  tired: "bg-purple-500",
  stressed: "bg-orange-500",
  sad: "bg-indigo-500",
  angry: "bg-red-500",
};

export function MoodCalendar() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedMood, setSelectedMood] = useState<{
    mood: string;
    note: string;
  } | null>(null);

  return (
    <div className="flex flex-col md:flex-row gap-4">
      <Calendar
        mode="single"
        selected={date}
        onSelect={setDate}
        className="border rounded-md"
        modifiers={{
          booked: (date) => {
            const dateStr = date.toISOString().split("T")[0];
            return dateStr in moodData;
          },
        }}
        modifiersStyles={{
          booked: { fontWeight: "bold" },
        }}
        components={{
          DayContent: ({ date, ...props }) => {
            const dateStr = date.toISOString().split("T")[0];
            const moodEntry = moodData[dateStr];

            return (
              <div
                {...props}
                onClick={() => {
                  setDate(date);
                  setSelectedMood(moodEntry || null);
                }}
                className="relative w-full h-full flex items-center justify-center"
              >
                {date.getDate()}
                {moodEntry && (
                  <div
                    className={cn(
                      "absolute bottom-0 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full",
                      moodColors[moodEntry.mood]
                    )}
                  />
                )}
              </div>
            );
          },
        }}
      />

      <Card className="flex-1">
        <CardContent className="p-4">
          {selectedMood ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "w-4 h-4 rounded-full",
                    moodColors[selectedMood.mood]
                  )}
                />
                <h3 className="font-medium capitalize">{selectedMood.mood}</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                {selectedMood.note}
              </p>
              <p className="text-xs text-muted-foreground">
                {date?.toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              {date
                ? "No mood logged for this date"
                : "Select a date to view mood details"}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
