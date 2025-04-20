import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const data = [
  {
    date: "Apr 1",
    happy: 1,
    excited: 0,
    calm: 0,
    neutral: 0,
    tired: 0,
    stressed: 0,
    sad: 0,
  },
  {
    date: "Apr 2",
    happy: 0,
    excited: 0,
    calm: 1,
    neutral: 0,
    tired: 0,
    stressed: 0,
    sad: 0,
  },
  {
    date: "Apr 3",
    happy: 0,
    excited: 0,
    calm: 0,
    neutral: 0,
    tired: 0,
    stressed: 1,
    sad: 0,
  },
  {
    date: "Apr 4",
    happy: 0,
    excited: 0,
    calm: 0,
    neutral: 1,
    tired: 0,
    stressed: 0,
    sad: 0,
  },
  {
    date: "Apr 5",
    happy: 0,
    excited: 1,
    calm: 0,
    neutral: 0,
    tired: 0,
    stressed: 0,
    sad: 0,
  },
  {
    date: "Apr 6",
    happy: 1,
    excited: 0,
    calm: 0,
    neutral: 0,
    tired: 0,
    stressed: 0,
    sad: 0,
  },
  {
    date: "Apr 7",
    happy: 0,
    excited: 0,
    calm: 0,
    neutral: 0,
    tired: 1,
    stressed: 0,
    sad: 0,
  },
  {
    date: "Apr 8",
    happy: 0,
    excited: 0,
    calm: 1,
    neutral: 0,
    tired: 0,
    stressed: 0,
    sad: 0,
  },
  {
    date: "Apr 9",
    happy: 1,
    excited: 0,
    calm: 0,
    neutral: 0,
    tired: 0,
    stressed: 0,
    sad: 0,
  },
  {
    date: "Apr 10",
    happy: 0,
    excited: 0,
    calm: 1,
    neutral: 0,
    tired: 0,
    stressed: 0,
    sad: 0,
  },
  {
    date: "Apr 11",
    happy: 0,
    excited: 0,
    calm: 0,
    neutral: 0,
    tired: 0,
    stressed: 1,
    sad: 0,
  },
  {
    date: "Apr 12",
    happy: 0,
    excited: 0,
    calm: 0,
    neutral: 0,
    tired: 0,
    stressed: 0,
    sad: 1,
  },
  {
    date: "Apr 13",
    happy: 0,
    excited: 0,
    calm: 0,
    neutral: 1,
    tired: 0,
    stressed: 0,
    sad: 0,
  },
  {
    date: "Apr 14",
    happy: 1,
    excited: 0,
    calm: 0,
    neutral: 0,
    tired: 0,
    stressed: 0,
    sad: 0,
  },
];

const colors = {
  happy: "#4ade80",
  excited: "#facc15",
  calm: "#60a5fa",
  neutral: "#94a3b8",
  tired: "#c084fc",
  stressed: "#fb923c",
  sad: "#818cf8",
};

export function PersonalMoodChart() {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
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
