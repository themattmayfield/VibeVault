'use client';

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import { moodOptions } from '@/lib/getMoodEmoji';

const moodColorMap: Record<string, string> = Object.fromEntries(
  moodOptions.map((m) => [m.value, m.hexColor])
);

interface MoodPieChartProps {
  data: Array<{ mood: string; count: number }>;
}

export function MoodPieChart({ data }: MoodPieChartProps) {
  const chartData = data.map((d) => ({
    name: d.mood.charAt(0).toUpperCase() + d.mood.slice(1),
    value: d.count,
    color: moodColorMap[d.mood] ?? '#94a3b8',
  }));

  if (chartData.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center text-muted-foreground">
        No mood data yet today
      </div>
    );
  }

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            label={({ name, percent }: { name?: string; percent?: number }) =>
              `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`
            }
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
