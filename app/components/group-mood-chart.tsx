import { moodOptions } from '@/lib/getMoodEmoji';
import { convexQuery } from '@convex-dev/react-query';
import { useSuspenseQuery } from '@tanstack/react-query';
import { api } from 'convex/_generated/api';
import type { Id } from 'convex/_generated/dataModel';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';

export function GroupMoodChart({ groupId }: { groupId: Id<'groups'> }) {
  const { data: moods } = useSuspenseQuery(
    convexQuery(api.groups.getGroupMoodDistributionLast30Days, {
      groupId,
    })
  );

  const moodDistributionWithColors = moods.map((mood) => {
    return {
      ...mood,
      color: moodOptions.find((m) => m.value === mood.name)?.hexColor,
    };
  });

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={moodDistributionWithColors}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            label={({ name, percent }) =>
              `${name} ${(percent * 100).toFixed(0)}%`
            }
          >
            {moodDistributionWithColors.map((entry, index) => (
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
