import { useState, useEffect } from 'react';
import './WaterMeter.css';

export const WaterMeter = ({ usage, maxUsage = 200 }) => {
  const [percentage, setPercentage] = useState(0);

  useEffect(() => {
    // Animate the fill
    const timer = setTimeout(() => {
      setPercentage(Math.min((usage / maxUsage) * 100, 100));
    }, 100);
    return () => clearTimeout(timer);
  }, [usage, maxUsage]);

  const getColor = () => {
    if (percentage > 80) return '#ef4444'; // red
    if (percentage > 60) return '#f59e0b'; // orange
    return '#3b82f6'; // blue
  };

  return (
    <div className="water-meter" data-testid="water-meter">
      <div className="water-meter-container">
        <div className="water-meter-glass">
          <div
            className="water-meter-fill"
            style={{
              height: `${percentage}%`,
              backgroundColor: getColor(),
            }}
          >
            <div className="water-wave"></div>
          </div>
        </div>
        <div className="water-meter-label">
          <div className="text-3xl font-bold" data-testid="usage-value">{usage.toFixed(1)}</div>
          <div className="text-sm text-gray-600">Liters</div>
        </div>
      </div>
    </div>
  );
};
