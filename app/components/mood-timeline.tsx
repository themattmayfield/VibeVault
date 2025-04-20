"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const data = [
  {
    time: "6 AM",
    happy: 10,
    excited: 5,
    calm: 15,
    neutral: 8,
    tired: 20,
    stressed: 5,
    sad: 2,
  },
  {
    time: "9 AM",
    happy: 25,
    excited: 15,
    calm: 10,
    neutral: 12,
    tired: 15,
    stressed: 10,
    sad: 3,
  },
  {
    time: "12 PM",
    happy: 40,
    excited: 20,
    calm: 8,
    neutral: 15,
    tired: 10,
    stressed: 15,
    sad: 5,
  },
  {
    time: "3 PM",
    happy: 30,
    excited: 15,
    calm: 12,
    neutral: 20,
    tired: 18,
    stressed: 25,
    sad: 8,
  },
  {
    time: "6 PM",
    happy: 45,
    excited: 25,
    calm: 20,
    neutral: 15,
    tired: 10,
    stressed: 10,
    sad: 5,
  },
  {
    time: "9 PM",
    happy: 35,
    excited: 15,
    calm: 30,
    neutral: 10,
    tired: 25,
    stressed: 5,
    sad: 3,
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

export function MoodTimeline() {
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
          <XAxis dataKey="time" />
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
