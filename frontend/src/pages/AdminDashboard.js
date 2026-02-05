import { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { StatsCard } from '../components/StatsCard';
import { UsageChart } from '../components/UsageChart';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { adminAPI } from '../services/api';
import { Users, Droplets, AlertTriangle, Activity, TrendingUp, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [allUsage, setAllUsage] = useState([]);
  const [allAlerts, setAllAlerts] = useState([]);
  const [issueReports, setIssueReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, usageRes, alertsRes, issuesRes] = await Promise.all([
        adminAPI.getStats(),
        adminAPI.getUsers(),
        adminAPI.getAllUsage(),
        adminAPI.getAllAlerts(),
        adminAPI.getAllIssues()
      ]);

      setStats(statsRes.data);
      setUsers(usersRes.data.users);
      setAllUsage(usageRes.data.usage);
      setAllAlerts(alertsRes.data.alerts);
      setIssueReports(issuesRes.data.reports || []);
    } catch (error) {
      toast.error('Failed to fetch admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleResolveIssue = async (reportId) => {
    try {
      await adminAPI.updateIssue(reportId, { status: 'Resolved' });
      toast.success('Issue marked as resolved');
      fetchData();
    } catch (error) {
      toast.error('Failed to update issue status');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  const criticalAlerts = allAlerts.filter(a => a.severity === 'critical' && a.status !== 'resolved');
  const activeAlerts = allAlerts.filter(a => a.status !== 'resolved');

  return (
    <div className="min-h-screen bg-gray-50" data-testid="admin-dashboard">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">System-wide water usage monitoring and management</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Users"
            value={stats?.total_users || 0}
            icon={Users}
            color="blue"
          />
          <StatsCard
            title="Total Water Usage"
            value={(stats?.total_water_usage || 0).toFixed(1)}
            unit="L"
            icon={Droplets}
            color="blue"
          />
          <StatsCard
            title="Active Alerts"
            value={stats?.active_alerts || 0}
            icon={AlertTriangle}
            color={stats?.active_alerts > 0 ? 'red' : 'green'}
          />
          <StatsCard
            title="Leak Reports"
            value={stats?.leak_reports || 0}
            icon={Activity}
            color="red"
          />
        </div>

        {/* Usage Distribution */}
        {stats?.usage_distribution && (
          <Card className="mb-8" data-testid="usage-distribution-card">
            <CardHeader>
              <CardTitle>Usage Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-700">
                    {stats.usage_distribution.normal}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Normal</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-700">
                    {stats.usage_distribution.high}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">High</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-700">
                    {stats.usage_distribution.critical}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Critical</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Charts */}
        <div className="mb-8">
          <UsageChart data={allUsage} title="System-wide Usage (Last 14 Days)" type="bar" />
        </div>

        {/* Detailed Tables */}
        <Tabs defaultValue="users" className="space-y-4">
          <TabsList>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
            <TabsTrigger value="usage">Recent Usage</TabsTrigger>
            <TabsTrigger value="issues">Issue Reports</TabsTrigger> 
          </TabsList>

          <TabsContent value="users">
            <Card data-testid="users-table-card">
              <CardHeader>
                <CardTitle>All Users ({users.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-semibold text-gray-700">Name</th>
                        <th className="text-left p-3 font-semibold text-gray-700">Email</th>
                        <th className="text-left p-3 font-semibold text-gray-700">Role</th>
                        <th className="text-left p-3 font-semibold text-gray-700">Joined</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(user => (
                        <tr key={user.id} className="border-b hover:bg-gray-50" data-testid={`user-row-${user.id}`}>
                          <td className="p-3">{user.name}</td>
                          <td className="p-3">{user.email}</td>
                          <td className="p-3">
                            <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                              {user.role}
                            </Badge>
                          </td>
                          <td className="p-3 text-sm text-gray-600">
                            {new Date(user.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alerts">
            <Card data-testid="alerts-table-card">
              <CardHeader>
                <CardTitle>All Alerts ({allAlerts.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-semibold text-gray-700">User ID</th>
                        <th className="text-left p-3 font-semibold text-gray-700">Type</th>
                        <th className="text-left p-3 font-semibold text-gray-700">Severity</th>
                        <th className="text-left p-3 font-semibold text-gray-700">Message</th>
                        <th className="text-left p-3 font-semibold text-gray-700">Status</th>
                        <th className="text-left p-3 font-semibold text-gray-700">Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allAlerts.slice(0, 20).map(alert => (
                        <tr key={alert.id} className="border-b hover:bg-gray-50" data-testid={`alert-row-${alert.id}`}>
                          <td className="p-3 text-sm text-gray-600">{alert.user_id?.substring(0, 12) || 'N/A'}...</td>
                          <td className="p-3">
                            <Badge variant="outline">{alert.alert_type}</Badge>
                          </td>
                          <td className="p-3">
                            <Badge variant={alert.severity === 'critical' ? 'destructive' : 'default'}>
                              {alert.severity}
                            </Badge>
                          </td>
                          <td className="p-3 text-sm">{alert.message?.substring(0, 50) || 'N/A'}...</td>
                          <td className="p-3">
                            <Badge variant={alert.status === 'resolved' ? 'secondary' : 'default'}>
                              {alert.status}
                            </Badge>
                          </td>
                          <td className="p-3 text-sm text-gray-600">
                            {new Date(alert.created_at).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="usage">
            <Card data-testid="usage-table-card">
              <CardHeader>
                <CardTitle>Recent Usage Records ({allUsage.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-semibold text-gray-700">User ID</th>
                        <th className="text-left p-3 font-semibold text-gray-700">Usage</th>
                        <th className="text-left p-3 font-semibold text-gray-700">Category</th>
                        <th className="text-left p-3 font-semibold text-gray-700">Location</th>
                        <th className="text-left p-3 font-semibold text-gray-700">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allUsage.slice(0, 20).map(usage => (
                        <tr key={usage.id} className="border-b hover:bg-gray-50" data-testid={`usage-row-${usage.id}`}>
                          <td className="p-3 text-sm text-gray-600">{usage.user_id?.substring(0, 12) || 'N/A'}...</td>
                          <td className="p-3 font-semibold">{usage.usage?.toFixed(2) || '0.00'} L</td>
                          <td className="p-3">
                            <Badge
                              variant={
                                usage.category === 'Critical'
                                  ? 'destructive'
                                  : usage.category === 'High'
                                  ? 'default'
                                  : 'secondary'
                              }
                            >
                              {usage.category}
                            </Badge>
                          </td>
                          <td className="p-3 text-sm">{usage.location || 'N/A'}</td>
                          <td className="p-3 text-sm text-gray-600">
                            {new Date(usage.timestamp).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Issue Reports Tab */}
          <TabsContent value="issues">
            <Card data-testid="admin-issues-card">
              <CardHeader>
                <CardTitle>User Issue Reports</CardTitle>
                <p className="text-sm text-gray-600">
                  Total: {issueReports.length} | 
                  Pending: {issueReports.filter(r => r.status === 'Pending').length} | 
                  Resolved: {issueReports.filter(r => r.status === 'Resolved').length}
                </p>
              </CardHeader>
              <CardContent>
                {issueReports.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No issue reports</p>
                ) : (
                  <div className="space-y-4">
                    {issueReports.map((report) => (
                      <div key={report.id} className="border rounded-lg p-4 bg-white hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">{report.user_name}</span>
                            <span className="text-sm text-gray-500">({report.user_email})</span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(report.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        
                        <div className="flex items-start gap-2 mb-3">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            report.problem_level === 'High' ? 'bg-red-100 text-red-700' :
                            report.problem_level === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {report.problem_level}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 ${
                            report.status === 'Resolved' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-orange-100 text-orange-700'
                          }`}>
                            {report.status === 'Resolved' ? (
                              <><CheckCircle className="h-3 w-3" /> Resolved</>
                            ) : (
                              <><AlertCircle className="h-3 w-3" /> Pending</>
                            )}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-700 mb-3">{report.problem_description}</p>
                        
                        {report.status === 'Pending' ? (
                          <Button 
                            size="sm" 
                            onClick={() => handleResolveIssue(report.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Mark as Resolved
                          </Button>
                        ) : (
                          <p className="text-xs text-green-600">
                            Resolved on {new Date(report.resolved_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}