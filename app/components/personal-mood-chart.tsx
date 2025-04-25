import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useSuspenseQuery } from '@tanstack/react-query';
import { convexQuery } from '@convex-dev/react-query';
import { api } from 'convex/_generated/api';
import { useLoaderData } from '@tanstack/react-router';
import { moodOptions } from '../lib/getMoodEmoji';
import { usersTimeZone } from '@/constants/userTimeZone';

export function PersonalMoodChart() {
  const user = useLoaderData({
    from: '/_authenticated',
  });
  const { data: getMoodTrends } = useSuspenseQuery(
    convexQuery(api.mood.getMoodTrends, {
      userId: user._id,
      usersTimeZone,
    })
  );

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={getMoodTrends.trends}
          margin={{
            top: 20,
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
          {moodOptions.map((mood) => (
            <Bar
              key={mood.value}
              dataKey={mood.value}
              stackId="a"
              fill={mood.hexColor}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
