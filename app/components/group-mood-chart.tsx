import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';

const data = [
  { name: 'Happy', value: 5, color: '#4ade80' },
  { name: 'Excited', value: 2, color: '#facc15' },
  { name: 'Calm', value: 3, color: '#60a5fa' },
  { name: 'Neutral', value: 1, color: '#94a3b8' },
  { name: 'Tired', value: 1, color: '#c084fc' },
  { name: 'Stressed', value: 2, color: '#fb923c' },
  { name: 'Sad', value: 0, color: '#818cf8' },
];

export function GroupMoodChart() {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
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
            {data.map((entry, index) => (
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
