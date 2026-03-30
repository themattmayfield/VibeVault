'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { moodOptions } from '@/lib/getMoodEmoji';

const moodColorMap: Record<string, string> = Object.fromEntries(
  moodOptions.map((m) => [m.value, m.hexColor])
);

// The mood keys we render lines for
const MOOD_KEYS = [
  'happy',
  'excited',
  'calm',
  'neutral',
  'tired',
  'stressed',
  'sad',
  'angry',
  'anxious',
] as const;

interface TimelineDataPoint {
  date: string;
  [mood: string]: string | number;
}

interface MoodTimelineProps {
  data: TimelineDataPoint[];
}

export function MoodTimeline({ data }: MoodTimelineProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center text-muted-foreground">
        No mood data available yet
      </div>
    );
  }

  // Only show lines for moods that have at least one non-zero entry
  const activeMoods = MOOD_KEYS.filter((mood) =>
    data.some((d) => (d[mood] as number) > 0)
  );

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          {activeMoods.map((mood) => (
            <Line
              key={mood}
              type="monotone"
              dataKey={mood}
              stroke={moodColorMap[mood] ?? '#94a3b8'}
              activeDot={mood === 'happy' ? { r: 8 } : undefined}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
