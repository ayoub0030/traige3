import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { AlertCircle, AlertTriangle, Info, Bug, Activity, RefreshCw, Trash2 } from 'lucide-react';

interface ErrorLog {
  timestamp: string;
  severity: string;
  category: string;
  message: string;
  details?: any;
  stack?: string;
  endpoint?: string;
  method?: string;
}

interface ErrorStats {
  totalErrors: number;
  byCategory: Record<string, number>;
  bySeverity: Record<string, number>;
  topErrors: Array<{ category: string; severity: string; count: number }>;
  today?: {
    total: number;
    byHour: Record<string, number>;
  };
}

export default function ErrorDashboard() {
  const [logs, setLogs] = useState<ErrorLog[]>([]);
  const [stats, setStats] = useState<ErrorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSeverity, setSelectedSeverity] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [expandedLog, setExpandedLog] = useState<number | null>(null);

  useEffect(() => {
    fetchLogs();
    fetchStats();
  }, [selectedSeverity, selectedCategory]);

  const fetchLogs = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedSeverity) params.append('severity', selectedSeverity);
      if (selectedCategory) params.append('category', selectedCategory);
      params.append('limit', '100');

      const response = await fetch(`/api/error-logs/logs?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setLogs(data.logs);
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/error-logs/stats');
      const data = await response.json();
      
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const clearOldLogs = async () => {
    if (!confirm('Are you sure you want to clear logs older than 30 days?')) return;
    
    try {
      const response = await fetch('/api/error-logs/clear-old', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ daysToKeep: 30 })
      });
      
      const data = await response.json();
      if (data.success) {
        alert(data.message);
        fetchLogs();
        fetchStats();
      }
    } catch (error) {
      console.error('Failed to clear old logs:', error);
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
      case 'ERROR':
        return <AlertCircle className="h-4 w-4" />;
      case 'WARNING':
        return <AlertTriangle className="h-4 w-4" />;
      case 'INFO':
        return <Info className="h-4 w-4" />;
      default:
        return <Bug className="h-4 w-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-purple-500';
      case 'ERROR':
        return 'bg-red-500';
      case 'WARNING':
        return 'bg-yellow-500';
      case 'INFO':
        return 'bg-blue-500';
      case 'DEBUG':
        return 'bg-gray-500';
      default:
        return 'bg-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Error Dashboard</h1>
        <div className="flex gap-2">
          <Button onClick={fetchLogs} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={clearOldLogs} variant="destructive">
            <Trash2 className="h-4 w-4 mr-2" />
            Clear Old Logs
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Errors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalErrors}</div>
              {stats.today && (
                <p className="text-xs text-muted-foreground">
                  {stats.today.total} today
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Critical Errors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-500">
                {stats.bySeverity['CRITICAL'] || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Errors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">
                {stats.bySeverity['ERROR'] || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Warnings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-500">
                {stats.bySeverity['WARNING'] || 0}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="ERROR">Error</option>
              <option value="WARNING">Warning</option>
              <option value="INFO">Info</option>
              <option value="DEBUG">Debug</option>
            </select>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="">All Categories</option>
              <option value="DATABASE">Database</option>
              <option value="API">API</option>
              <option value="AUTH">Auth</option>
              <option value="PAYMENT">Payment</option>
              <option value="MULTIPLAYER">Multiplayer</option>
              <option value="AI_GENERATION">AI Generation</option>
              <option value="SYSTEM">System</option>
              <option value="CLIENT">Client</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Error Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Errors</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {logs.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No errors found with the selected filters
              </p>
            ) : (
              logs.map((log, index) => (
                <div
                  key={index}
                  className="border rounded-lg p-3 hover:bg-accent/50 cursor-pointer"
                  onClick={() => setExpandedLog(expandedLog === index ? null : index)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2">
                      {getSeverityIcon(log.severity)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge className={getSeverityColor(log.severity)}>
                            {log.severity}
                          </Badge>
                          <Badge variant="outline">{log.category}</Badge>
                          {log.endpoint && (
                            <Badge variant="secondary">
                              {log.method} {log.endpoint}
                            </Badge>
                          )}
                        </div>
                        <p className="mt-1 font-medium">{log.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(log.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {expandedLog === index && (
                    <div className="mt-3 pt-3 border-t">
                      {log.details && (
                        <div className="mb-2">
                          <p className="text-sm font-medium mb-1">Details:</p>
                          <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        </div>
                      )}
                      {log.stack && (
                        <div>
                          <p className="text-sm font-medium mb-1">Stack Trace:</p>
                          <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                            {log.stack}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}