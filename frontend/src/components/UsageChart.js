import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export const UsageChart = ({ data, title = "Water Usage", type = "line" }) => {
  if (!data || data.length === 0) {
    return (
      <Card data-testid="usage-chart-empty">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-gray-500">
            <p>No usage data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatData = () => {
    // Group by date and sum usage
    const grouped = data.reduce((acc, item) => {
      const date = new Date(item.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!acc[date]) {
        acc[date] = { date, usage: 0 };
      }
      acc[date].usage += item.usage;
      return acc;
    }, {});

    return Object.values(grouped).slice(-14); // Last 14 days
  };

  const chartData = formatData();

  return (
    <Card data-testid="usage-chart">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          {type === 'line' ? (
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="date" stroke="#666" fontSize={12} />
              <YAxis stroke="#666" fontSize={12} label={{ value: 'Liters', angle: -90, position: 'insideLeft' }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '8px' }}
                formatter={(value) => [`${value.toFixed(2)} L`, 'Usage']}
              />
              <Line
                type="monotone"
                dataKey="usage"
                stroke="#2563eb"
                strokeWidth={3}
                dot={{ fill: '#2563eb', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          ) : (
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="date" stroke="#666" fontSize={12} />
              <YAxis stroke="#666" fontSize={12} />
              <Tooltip
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '8px' }}
                formatter={(value) => [`${value.toFixed(2)} L`, 'Usage']}
              />
              <Bar dataKey="usage" fill="#2563eb" radius={[8, 8, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
