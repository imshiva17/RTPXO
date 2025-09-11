"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import type { PerformanceMetrics, PerformanceAlert, PerformanceTrend, KPITarget } from "@/lib/performance-monitor"
import { createPerformanceMonitor } from "@/lib/performance-monitor"
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Activity,
  BarChart3,
  Target,
  Download,
  RefreshCw,
} from "lucide-react"

interface PerformanceDashboardProps {
  currentMetrics?: PerformanceMetrics
  onRefresh?: () => void
}

export function PerformanceDashboard({ currentMetrics, onRefresh }: PerformanceDashboardProps) {
  const [performanceMonitor] = useState(() => createPerformanceMonitor())
  const [historicalData, setHistoricalData] = useState<PerformanceMetrics[]>([])
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([])
  const [trends, setTrends] = useState<PerformanceTrend[]>([])
  const [targets, setTargets] = useState<KPITarget[]>([])
  const [systemHealth, setSystemHealth] = useState(0)
  const [selectedTimeframe, setSelectedTimeframe] = useState<"1h" | "24h" | "7d" | "30d">("24h")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    loadPerformanceData()

    // Refresh data every 5 minutes
    const interval = setInterval(loadPerformanceData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [selectedTimeframe])

  const loadPerformanceData = async () => {
    setIsLoading(true)
    try {
      // Get historical metrics
      const historical = performanceMonitor.getHistoricalMetrics(
        selectedTimeframe === "1h" ? 1 : selectedTimeframe === "24h" ? 24 : selectedTimeframe === "7d" ? 168 : 720,
      )
      setHistoricalData(historical)

      // Get alerts and trends
      setAlerts(performanceMonitor.getActiveAlerts())
      setTrends(performanceMonitor.getTrends(selectedTimeframe))
      setTargets(performanceMonitor.getTargets())
      setSystemHealth(performanceMonitor.getSystemHealthScore())
    } catch (error) {
      console.error("Failed to load performance data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = () => {
    loadPerformanceData()
    onRefresh?.()
  }

  const acknowledgeAlert = (alertId: string) => {
    performanceMonitor.acknowledgeAlert(alertId)
    setAlerts(performanceMonitor.getActiveAlerts())
  }

  const generateReport = () => {
    const endDate = new Date()
    const startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000) // Last 24 hours

    try {
      const report = performanceMonitor.generateReport(startDate, endDate)
      console.log("Generated report:", report)
      // In a real app, this would trigger a download or open a report viewer
    } catch (error) {
      console.error("Failed to generate report:", error)
    }
  }

  const getHealthColor = (score: number) => {
    if (score >= 90) return "text-primary"
    if (score >= 75) return "text-chart-1"
    if (score >= 60) return "text-chart-3"
    return "text-destructive"
  }

  const getHealthStatus = (score: number) => {
    if (score >= 90) return "Excellent"
    if (score >= 75) return "Good"
    if (score >= 60) return "Fair"
    return "Poor"
  }

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-primary" />
      case "down":
        return <TrendingDown className="h-4 w-4 text-destructive" />
      default:
        return <BarChart3 className="h-4 w-4 text-muted-foreground" />
    }
  }

  const formatChartData = (data: PerformanceMetrics[]) => {
    return data.map((d) => ({
      time: d.timestamp.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      punctuality: d.punctuality,
      delay: d.averageDelay,
      throughput: d.throughput,
      efficiency: d.systemEfficiency,
      satisfaction: d.customerSatisfaction,
    }))
  }

  const chartData = formatChartData(historicalData)

  const healthData = [
    { name: "Healthy", value: systemHealth, fill: "#059669" },
    { name: "Issues", value: 100 - systemHealth, fill: "#e5e7eb" },
  ]

  return (
    <div className="h-full flex flex-col">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Performance Monitoring
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={generateReport}>
              <Download className="h-4 w-4 mr-2" />
              Report
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0">
        <Tabs defaultValue="overview" className="h-full">
          <TabsList className="grid w-full grid-cols-4 m-4 mb-0">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="h-[calc(100%-60px)] overflow-y-auto">
            <div className="p-4 space-y-6">
              {/* System Health Score */}
              <Card className="border-l-4 border-l-primary">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    System Health Score
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Overall Health</span>
                        <span className={`text-2xl font-bold ${getHealthColor(systemHealth)}`}>{systemHealth}%</span>
                      </div>
                      <Progress value={systemHealth} className="h-3" />
                      <p className="text-sm text-muted-foreground mt-2">
                        Status: <span className={getHealthColor(systemHealth)}>{getHealthStatus(systemHealth)}</span>
                      </p>
                    </div>
                    <div className="w-24 h-24">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={healthData} cx="50%" cy="50%" innerRadius={25} outerRadius={40} dataKey="value">
                            {healthData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Key Performance Indicators */}
              <div className="grid grid-cols-2 gap-4">
                {targets.map((target) => {
                  const currentValue = (currentMetrics?.[target.metric as keyof PerformanceMetrics] as number) || 0
                  const isOnTarget =
                    target.metric === "averageDelay" ? currentValue <= target.target : currentValue >= target.target

                  return (
                    <Card key={target.metric}>
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium capitalize">
                              {target.metric.replace(/([A-Z])/g, " $1").trim()}
                            </span>
                            {isOnTarget ? (
                              <CheckCircle className="h-4 w-4 text-primary" />
                            ) : (
                              <AlertTriangle className="h-4 w-4 text-chart-3" />
                            )}
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-2xl font-bold">
                              {currentValue.toFixed(1)}
                              {target.unit}
                            </span>
                            <Badge variant={isOnTarget ? "default" : "secondary"}>
                              Target: {target.target}
                              {target.unit}
                            </Badge>
                          </div>

                          <Progress
                            value={
                              target.metric === "averageDelay"
                                ? Math.max(0, 100 - (currentValue / target.critical) * 100)
                                : Math.min(100, (currentValue / target.target) * 100)
                            }
                            className="h-2"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              {/* Recent Trends */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Performance Trends ({selectedTimeframe})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {trends.map((trend) => (
                    <div key={trend.metric} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getTrendIcon(trend.direction)}
                        <span className="text-sm capitalize">{trend.metric.replace(/([A-Z])/g, " $1").trim()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {trend.changePercentage > 0 ? "+" : ""}
                          {trend.changePercentage.toFixed(1)}%
                        </Badge>
                        <span className="text-xs text-muted-foreground capitalize">{trend.direction}</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="metrics" className="h-[calc(100%-60px)] overflow-y-auto">
            <div className="p-4 space-y-6">
              {/* Timeframe Selector */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Timeframe:</span>
                {(["1h", "24h", "7d", "30d"] as const).map((timeframe) => (
                  <Button
                    key={timeframe}
                    variant={selectedTimeframe === timeframe ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedTimeframe(timeframe)}
                  >
                    {timeframe}
                  </Button>
                ))}
              </div>

              {/* Punctuality Chart */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Punctuality Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="time" />
                        <YAxis domain={[0, 100]} />
                        <Tooltip />
                        <Line
                          type="monotone"
                          dataKey="punctuality"
                          stroke="#059669"
                          strokeWidth={2}
                          dot={{ fill: "#059669", strokeWidth: 2, r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Delay and Throughput */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Average Delay</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="time" />
                          <YAxis />
                          <Tooltip />
                          <Area type="monotone" dataKey="delay" stroke="#f59e0b" fill="#fef3c7" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Throughput</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="time" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="throughput" fill="#3b82f6" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* System Efficiency and Customer Satisfaction */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">System Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="time" />
                        <YAxis domain={[0, 100]} />
                        <Tooltip />
                        <Line
                          type="monotone"
                          dataKey="efficiency"
                          stroke="#10b981"
                          strokeWidth={2}
                          name="System Efficiency"
                        />
                        <Line
                          type="monotone"
                          dataKey="satisfaction"
                          stroke="#8b5cf6"
                          strokeWidth={2}
                          name="Customer Satisfaction"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="alerts" className="h-[calc(100%-60px)] overflow-y-auto">
            <div className="p-4 space-y-4">
              {alerts.length === 0 ? (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>No active alerts. System is operating within normal parameters.</AlertDescription>
                </Alert>
              ) : (
                alerts.map((alert) => (
                  <Alert key={alert.id} variant={alert.type === "critical" ? "destructive" : "default"}>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{alert.message}</span>
                          <Badge variant={alert.type === "critical" ? "destructive" : "secondary"}>{alert.type}</Badge>
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>
                            Threshold: {alert.threshold} | Current: {alert.currentValue.toFixed(1)}
                          </span>
                          <span>{alert.timestamp.toLocaleString()}</span>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => acknowledgeAlert(alert.id)}
                          className="bg-transparent"
                        >
                          Acknowledge
                        </Button>
                      </div>
                    </AlertDescription>
                  </Alert>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="trends" className="h-[calc(100%-60px)] overflow-y-auto">
            <div className="p-4 space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Performance Analysis</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {trends.map((trend) => (
                    <div key={trend.metric} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium capitalize">{trend.metric.replace(/([A-Z])/g, " $1").trim()}</h4>
                        <div className="flex items-center gap-2">
                          {getTrendIcon(trend.direction)}
                          <Badge variant="outline">
                            {trend.changePercentage > 0 ? "+" : ""}
                            {trend.changePercentage.toFixed(1)}%
                          </Badge>
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground">
                        {trend.direction === "up" &&
                          trend.metric !== "averageDelay" &&
                          "Performance is improving over the selected timeframe."}
                        {trend.direction === "down" &&
                          trend.metric !== "averageDelay" &&
                          "Performance is declining and may need attention."}
                        {trend.direction === "up" &&
                          trend.metric === "averageDelay" &&
                          "Delays are increasing and need immediate attention."}
                        {trend.direction === "down" &&
                          trend.metric === "averageDelay" &&
                          "Delays are decreasing, showing improvement."}
                        {trend.direction === "stable" && "Performance is stable with minimal variation."}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </div>
  )
}
