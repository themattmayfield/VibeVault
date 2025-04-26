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

const data = [
  {
    date: 'Apr 1',
    happy: 3,
    excited: 1,
    calm: 2,
    neutral: 1,
    tired: 1,
    stressed: 2,
    sad: 0,
  },
  {
    date: 'Apr 2',
    happy: 4,
    excited: 2,
    calm: 1,
    neutral: 1,
    tired: 0,
    stressed: 1,
    sad: 0,
  },
  {
    date: 'Apr 3',
    happy: 2,
    excited: 1,
    calm: 2,
    neutral: 2,
    tired: 1,
    stressed: 3,
    sad: 0,
  },
  {
    date: 'Apr 4',
    happy: 3,
    excited: 0,
    calm: 3,
    neutral: 1,
    tired: 2,
    stressed: 2,
    sad: 1,
  },
  {
    date: 'Apr 5',
    happy: 5,
    excited: 2,
    calm: 1,
    neutral: 0,
    tired: 1,
    stressed: 1,
    sad: 0,
  },
  {
    date: 'Apr 6',
    happy: 4,
    excited: 3,
    calm: 2,
    neutral: 1,
    tired: 0,
    stressed: 0,
    sad: 0,
  },
  {
    date: 'Apr 7',
    happy: 3,
    excited: 2,
    calm: 3,
    neutral: 1,
    tired: 1,
    stressed: 1,
    sad: 0,
  },
];

const colors = {
  happy: '#4ade80',
  excited: '#facc15',
  calm: '#60a5fa',
  neutral: '#94a3b8',
  tired: '#c084fc',
  stressed: '#fb923c',
  sad: '#818cf8',
};

export function GroupMoodTimeline() {
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
