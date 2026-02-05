import { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { StatsCard } from '../components/StatsCard';
import { AlertCard } from '../components/AlertCard';
import { UsageChart } from '../components/UsageChart';
import { WaterMeter } from '../components/WaterMeter';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { usageAPI, alertAPI, reportAPI, issueAPI } from '../services/api';
import { Droplets, TrendingUp, Calendar, Bell, Download, Plus, BarChart3, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function UserDashboard() {
  const [stats, setStats] = useState(null);
  const [usageData, setUsageData] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newUsage, setNewUsage] = useState('');
  
  // Issue reporting states
  const [issueReports, setIssueReports] = useState([]);
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [newIssue, setNewIssue] = useState({ problem_description: '', problem_level: 'Low' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, usageRes, alertsRes, issuesRes] = await Promise.all([
        usageAPI.getStats(),
        usageAPI.getAll({ days: 30 }),
        alertAPI.getAll(),
        issueAPI.getAll()
      ]);

      setStats(statsRes.data);
      setUsageData(usageRes.data.usage);
      setAlerts(alertsRes.data.alerts);
      setIssueReports(issuesRes.data.reports || []);
    } catch (error) {
      toast.error('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddUsage = async (e) => {
    e.preventDefault();
    if (!newUsage || parseFloat(newUsage) <= 0) {
      toast.error('Please enter a valid usage amount');
      return;
    }

    try {
      await usageAPI.create({ usage: parseFloat(newUsage) });
      toast.success('Usage recorded successfully');
      setNewUsage('');
      fetchData();
    } catch (error) {
      toast.error('Failed to record usage');
    }
  };

  const handleSimulateData = async () => {
    try {
      await usageAPI.simulate(7);
      toast.success('Generated 7 days of simulated data');
      fetchData();
    } catch (error) {
      toast.error('Failed to simulate data');
    }
  };

// Fixed handleDownloadReport function using proper reportAPI service
const handleDownloadReport = async (type, format) => {
  try {
    toast.info(`Generating ${format.toUpperCase()} report...`);
    
    const response = await reportAPI.generate(type, format);
    
    // response.data is already a blob due to responseType: 'blob' in api.js
    const blob = response.data;
    
    if (blob.size === 0) {
      throw new Error("Received empty file from server");
    }

    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = `water_usage_${type}.${format}`;
    document.body.appendChild(link);
    link.click();
    link.remove();

    // Clean up the object URL
    setTimeout(() => window.URL.revokeObjectURL(downloadUrl), 100);

    toast.success(`${format.toUpperCase()} report downloaded successfully!`);
  } catch (error) {
    console.error('Download error:', error);
    
    // Handle blob error responses
    if (error.response?.data instanceof Blob) {
      try {
        const errorText = await error.response.data.text();
        const errorJson = JSON.parse(errorText);
        toast.error(errorJson.error || 'Failed to generate report');
      } catch {
        toast.error('Failed to generate report');
      }
    } else {
      toast.error(error.response?.data?.error || error.message || 'Failed to generate report');
    }
  }
};



  const handleSubmitIssue = async (e) => {
    e.preventDefault();
    if (!newIssue.problem_description.trim()) {
      toast.error('Please describe the problem');
      return;
    }

    try {
      await issueAPI.create(newIssue);
      toast.success('Issue reported successfully');
      setNewIssue({ problem_description: '', problem_level: 'Low' });
      setShowIssueForm(false);
      fetchData();
    } catch (error) {
      toast.error('Failed to submit issue report');
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

  const currentDailyUsage = usageData.length > 0 ? usageData[0]?.usage || 0 : 0;
  const activeAlerts = alerts.filter(a => a.status === 'new');

  return (
    <div className="min-h-screen bg-gray-50" data-testid="user-dashboard">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Water Usage Dashboard</h1>
          <p className="text-gray-600">Monitor and track your water consumption</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Usage"
            value={stats?.total_usage?.toFixed(1) || 0}
            unit="L"
            icon={Droplets}
            color="blue"
          />
          <StatsCard
            title="Average Daily"
            value={stats?.average_daily?.toFixed(1) || 0}
            unit="L/day"
            icon={TrendingUp}
            color="green"
          />
          <StatsCard
            title="This Month"
            value={stats?.current_month?.toFixed(1) || 0}
            unit="L"
            trend={stats?.trend}
            icon={Calendar}
            color="blue"
          />
          <StatsCard
            title="Active Alerts"
            value={activeAlerts.length}
            icon={Bell}
            color={activeAlerts.length > 0 ? 'red' : 'green'}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Water Meter */}
          <Card data-testid="water-meter-card">
            <CardHeader>
              <CardTitle>Current Usage</CardTitle>
            </CardHeader>
            <CardContent>
              <WaterMeter usage={currentDailyUsage} maxUsage={200} />
            </CardContent>
          </Card>

          {/* Add Usage Form */}
          <Card data-testid="add-usage-card" className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Record Water Usage</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddUsage} className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Label htmlFor="usage">Usage Amount (Liters)</Label>
                    <Input
                      id="usage"
                      type="number"
                      step="0.1"
                      placeholder="Enter liters"
                      value={newUsage}
                      onChange={(e) => setNewUsage(e.target.value)}
                      data-testid="usage-input"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" data-testid="add-usage-button">
                    <Plus className="h-4 w-4 mr-2" />
                    Record Usage
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSimulateData}
                    data-testid="simulate-data-button"
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Generate Demo Data
                  </Button>
                </div>
              </form>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-700 font-medium mb-2">Quick Stats:</p>
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                  <div>Last Month: {stats?.last_month?.toFixed(1) || 0} L</div>
                  <div>Trend: <span className="capitalize">{stats?.trend || 'stable'}</span></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts and Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <UsageChart data={usageData} title="Usage Trend (Last 14 Days)" type="line" />
          <AlertCard alerts={activeAlerts} onUpdate={fetchData} />
        </div>

        {/* Reports Section */}
        <Card data-testid="reports-card">
          <CardHeader>
            <CardTitle>Reports & Export</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="daily">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="daily">Daily</TabsTrigger>
                <TabsTrigger value="weekly">Weekly</TabsTrigger>
                <TabsTrigger value="monthly">Monthly</TabsTrigger>
              </TabsList>
              
              {['daily', 'weekly', 'monthly'].map(type => (
                <TabsContent key={type} value={type} className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Download your {type} water usage report
                  </p>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleDownloadReport(type, 'pdf')}
                      data-testid={`download-${type}-pdf`}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download PDF
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleDownloadReport(type, 'csv')}
                      data-testid={`download-${type}-csv`}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download CSV
                    </Button>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>

        {/* Issue Reporting Section */}
        <Card className="mt-6" data-testid="issue-reports-card">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Report an Issue</CardTitle>
              <Button onClick={() => setShowIssueForm(!showIssueForm)} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Issue
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {showIssueForm && (
              <form onSubmit={handleSubmitIssue} className="mb-6 p-4 bg-gray-50 rounded-lg space-y-4">
                <div>
                  <Label htmlFor="problem_description">Problem Description</Label>
                  <textarea
                    id="problem_description"
                    className="w-full mt-1 p-2 border rounded-md min-h-[100px]"
                    placeholder="Describe the issue you're facing..."
                    value={newIssue.problem_description}
                    onChange={(e) => setNewIssue({...newIssue, problem_description: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="problem_level">Problem Level</Label>
                  <Select 
                    value={newIssue.problem_level} 
                    onValueChange={(value) => setNewIssue({...newIssue, problem_level: value})}
                  >
                    <SelectTrigger className="w-full mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Low">Low</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button type="submit">Submit Report</Button>
                  <Button type="button" variant="outline" onClick={() => setShowIssueForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            )}

            {/* My Reports */}
            <div>
              <h3 className="font-semibold mb-4">My Reports</h3>
              {issueReports.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">No issue reports yet</p>
              ) : (
                <div className="space-y-3">
                  {issueReports.map((report) => (
                    <div key={report.id} className="border rounded-lg p-4 bg-white hover:shadow-sm transition-shadow">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
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
                        <span className="text-xs text-gray-500">
                          {new Date(report.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{report.problem_description}</p>
                      {report.resolved_at && (
                        <p className="text-xs text-green-600 mt-2">
                          Resolved on {new Date(report.resolved_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
