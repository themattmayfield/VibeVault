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

const colors = {
  happy: '#4ade80',
  excited: '#facc15',
  calm: '#60a5fa',
  neutral: '#94a3b8',
  tired: '#c084fc',
  stressed: '#fb923c',
  sad: '#818cf8',
};

export function PersonalMoodChart() {
  const { user } = useLoaderData({
    from: '/_authenticated',
  });
  const { data: getMoodTrends } = useSuspenseQuery(
    convexQuery(api.mood.getMoodTrends, {
      neonUserId: user.id,
    })
  );
  const trendsWithFormattedDates = getMoodTrends.trends.map((trend) => ({
    ...trend,
    date: new Date(trend.date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }),
  }));
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={trendsWithFormattedDates}
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
          <Bar dataKey="happy" stackId="a" fill={colors.happy} />
          <Bar dataKey="excited" stackId="a" fill={colors.excited} />
          <Bar dataKey="calm" stackId="a" fill={colors.calm} />
          <Bar dataKey="neutral" stackId="a" fill={colors.neutral} />
          <Bar dataKey="tired" stackId="a" fill={colors.tired} />
          <Bar dataKey="stressed" stackId="a" fill={colors.stressed} />
          <Bar dataKey="sad" stackId="a" fill={colors.sad} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
