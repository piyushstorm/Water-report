import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export const StatsCard = ({ title, value, unit, trend, icon: Icon, color = 'blue' }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
    yellow: 'bg-yellow-50 text-yellow-600',
  };

  const getTrendIcon = () => {
    if (trend === 'increasing') return <TrendingUp className="h-4 w-4 text-red-500" />;
    if (trend === 'decreasing') return <TrendingDown className="h-4 w-4 text-green-500" />;
    return <Minus className="h-4 w-4 text-gray-500" />;
  };

  return (
    <Card data-testid="stats-card" className="hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
        {Icon && (
          <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
            <Icon className="h-4 w-4" />
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline space-x-2">
          <div className="text-3xl font-bold text-gray-900" data-testid="stats-value">
            {value}
          </div>
          {unit && <span className="text-sm text-gray-600">{unit}</span>}
        </div>
        {trend && (
          <div className="flex items-center mt-2 space-x-1" data-testid="stats-trend">
            {getTrendIcon()}
            <span className="text-xs text-gray-600 capitalize">{trend}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
