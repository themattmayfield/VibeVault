import { usersTimeZone } from '@/constants/userTimeZone';
import { convexQuery } from '@convex-dev/react-query';
import { useSuspenseQuery } from '@tanstack/react-query';
import { api } from 'convex/_generated/api';
import type { Id } from 'convex/_generated/dataModel';
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

const colors = {
  happy: '#4ade80',
  excited: '#facc15',
  calm: '#60a5fa',
  neutral: '#94a3b8',
  tired: '#c084fc',
  stressed: '#fb923c',
  sad: '#818cf8',
};

export function GroupMoodTimeline({ groupId }: { groupId: Id<'groups'> }) {
  const { data: moods } = useSuspenseQuery(
    convexQuery(api.groups.getGroupTimelineLast7Days, {
      groupId,
      usersTimeZone: usersTimeZone,
    })
  );

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={moods}
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
          <Line
            type="monotone"
            dataKey="happy"
            stroke={colors.happy}
            activeDot={{ r: 8 }}
          />
          <Line type="monotone" dataKey="excited" stroke={colors.excited} />
          <Line type="monotone" dataKey="calm" stroke={colors.calm} />
          <Line type="monotone" dataKey="neutral" stroke={colors.neutral} />
          <Line type="monotone" dataKey="tired" stroke={colors.tired} />
          <Line type="monotone" dataKey="stressed" stroke={colors.stressed} />
          <Line type="monotone" dataKey="sad" stroke={colors.sad} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
