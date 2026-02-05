import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { AlertTriangle, Info, AlertCircle, CheckCircle } from 'lucide-react';
import { alertAPI } from '../services/api';
import { useState } from 'react';
import { toast } from 'sonner';

export const AlertCard = ({ alerts, onUpdate }) => {
  const [loading, setLoading] = useState(false);

  const getSeverityColor = (severity) => {
    const colors = {
      critical: 'destructive',
      high: 'destructive',
      medium: 'default',
      low: 'secondary',
    };
    return colors[severity] || 'default';
  };

  const getSeverityIcon = (severity) => {
    if (severity === 'critical' || severity === 'high') return <AlertTriangle className="h-4 w-4" />;
    if (severity === 'medium') return <AlertCircle className="h-4 w-4" />;
    return <Info className="h-4 w-4" />;
  };

  const handleMarkAsRead = async (alertId) => {
    setLoading(true);
    try {
      await alertAPI.update(alertId, { status: 'read' });
      toast.success('Alert marked as read');
      if (onUpdate) onUpdate();
    } catch (error) {
      toast.error('Failed to update alert');
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (alertId) => {
    setLoading(true);
    try {
      await alertAPI.update(alertId, { status: 'resolved' });
      toast.success('Alert resolved');
      if (onUpdate) onUpdate();
    } catch (error) {
      toast.error('Failed to resolve alert');
    } finally {
      setLoading(false);
    }
  };

  if (!alerts || alerts.length === 0) {
    return (
      <Card data-testid="alert-card-empty">
        <CardHeader>
          <CardTitle>Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-gray-500">
            <CheckCircle className="h-12 w-12 mb-2 text-green-500" />
            <p>No active alerts</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="alert-card">
      <CardHeader>
        <CardTitle>Alerts ({alerts.length})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 max-h-96 overflow-y-auto">
        {alerts.map((alert) => (
          <Alert key={alert.id} data-testid={`alert-item-${alert.id}`} variant={getSeverityColor(alert.severity)}>
            <div className="flex items-start justify-between w-full">
              <div className="flex items-start space-x-2 flex-1">
                {getSeverityIcon(alert.severity)}
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <Badge variant={getSeverityColor(alert.severity)} className="text-xs">
                      {alert.severity}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {alert.alert_type.replace('_', ' ')}
                    </Badge>
                  </div>
                  <AlertDescription className="text-sm">
                    {alert.message}
                  </AlertDescription>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(alert.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex flex-col space-y-1 ml-2">
                {alert.status === 'new' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleMarkAsRead(alert.id)}
                    disabled={loading}
                    data-testid={`mark-read-btn-${alert.id}`}
                  >
                    Read
                  </Button>
                )}
                {alert.status !== 'resolved' && (
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => handleResolve(alert.id)}
                    disabled={loading}
                    data-testid={`resolve-btn-${alert.id}`}
                  >
                    Resolve
                  </Button>
                )}
              </div>
            </div>
          </Alert>
        ))}
      </CardContent>
    </Card>
  );
};
