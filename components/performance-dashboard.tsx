"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  X,
} from "lucide-react"

interface PerformanceDashboardProps {
  currentMetrics?: PerformanceMetrics
  onRefresh?: () => void
  trains?: TrainData[]
  conflicts?: RealTimeConflict[]
}

interface RealTimeConflict {
  id: string
  type: string
  trains: string[]
  severity: 'low' | 'medium' | 'high' | 'critical'
  location: string
  estimatedDelay: number
  aiRecommendation?: {
    action: string
    confidence: number
    reasoning: string
  }
}

interface TrainData {
  id: string
  name: string
  number: string
  type: string
  status: string
  delay: number
  speed: number
  currentStation: string
  nextStation: string
  coordinates: { lat: number; lng: number }
  priority: number
}

export function PerformanceDashboard({ currentMetrics, onRefresh, trains = [], conflicts = [] }: PerformanceDashboardProps) {
  const [performanceMonitor] = useState(() => createPerformanceMonitor())
  const [historicalData, setHistoricalData] = useState<PerformanceMetrics[]>([])
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([])
  const [trends, setTrends] = useState<PerformanceTrend[]>([])
  const [targets, setTargets] = useState<KPITarget[]>([])
  const [systemHealth, setSystemHealth] = useState(0)
  const [selectedTimeframe, setSelectedTimeframe] = useState<"1h" | "24h" | "7d" | "30d">("24h")
  const [isLoading, setIsLoading] = useState(false)
  const [selectedTrain, setSelectedTrain] = useState<string>('')
  const [manualAction, setManualAction] = useState<string>('')

  useEffect(() => {
    loadPerformanceData()

    // Refresh data every 5 seconds for real-time updates
    const interval = setInterval(() => {
      loadPerformanceData()
    }, 5000)
    return () => clearInterval(interval)
  }, [selectedTimeframe, trains, conflicts])

  const loadPerformanceData = async () => {
    setIsLoading(true)
    try {
      const historical = performanceMonitor.getHistoricalMetrics(
        selectedTimeframe === "1h" ? 1 : selectedTimeframe === "24h" ? 24 : selectedTimeframe === "7d" ? 168 : 720,
      )
      setHistoricalData(historical)
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

  const acceptRecommendation = (conflictId: string) => {
    const conflict = conflicts.find(c => c.id === conflictId)
    if (conflict?.aiRecommendation) {
      console.log('Accepting recommendation for conflict:', conflictId)
      onRefresh?.()
    }
  }

  const rejectRecommendation = (conflictId: string) => {
    console.log('Rejecting recommendation for conflict:', conflictId)
    onRefresh?.()
  }

  const executeManualAction = () => {
    if (selectedTrain && manualAction) {
      console.log('Executing manual action:', manualAction, 'for train:', selectedTrain)
      onRefresh?.()
      setSelectedTrain('')
      setManualAction('')
    }
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
          <TabsList className="grid w-full grid-cols-5 m-4 mb-0">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="conflicts">Live Conflicts</TabsTrigger>
            <TabsTrigger value="trains">Train Control</TabsTrigger>
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
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

          <TabsContent value="conflicts" className="h-[calc(100%-60px)] overflow-y-auto">
            <div className="p-4 space-y-4">
              {conflicts.length === 0 ? (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>No active conflicts detected. All systems operating normally.</AlertDescription>
                </Alert>
              ) : (
                conflicts.map((conflict) => (
                  <Card key={conflict.id} className="border-l-4 border-l-orange-500">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium">
                          {conflict.type.replace('_', ' ').toUpperCase()} - {conflict.location}
                        </CardTitle>
                        <Badge variant={conflict.severity === 'critical' ? 'destructive' : conflict.severity === 'high' ? 'secondary' : 'outline'}>
                          {conflict.severity.toUpperCase()}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="font-medium text-muted-foreground">Affected Trains:</span>
                          <p>{conflict.trains.join(', ')}</p>
                        </div>
                        <div>
                          <span className="font-medium text-muted-foreground">Est. Delay:</span>
                          <p>{conflict.estimatedDelay} minutes</p>
                        </div>
                      </div>
                      
                      {conflict.aiRecommendation && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <h4 className="font-semibold text-sm text-blue-800 mb-2">AI Recommendation</h4>
                          <p className="text-sm mb-2">{conflict.aiRecommendation.action}</p>
                          <p className="text-xs text-muted-foreground mb-3">{conflict.aiRecommendation.reasoning}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium">Confidence: {Math.round(conflict.aiRecommendation.confidence * 100)}%</span>
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => acceptRecommendation(conflict.id)}>
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Accept
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => rejectRecommendation(conflict.id)}>
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Reject
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="trains" className="h-[calc(100%-60px)] overflow-y-auto">
            <div className="p-4 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Manual Train Control</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="text-sm font-medium">Select Train</label>
                      <Select value={selectedTrain} onValueChange={setSelectedTrain}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose train..." />
                        </SelectTrigger>
                        <SelectContent>
                          {trains.map(train => (
                            <SelectItem key={train.id} value={train.id}>
                              {train.name} ({train.number})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Action</label>
                      <Select value={manualAction} onValueChange={setManualAction}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose action..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hold">Hold Train</SelectItem>
                          <SelectItem value="proceed">Proceed</SelectItem>
                          <SelectItem value="reroute">Reroute</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={executeManualAction} disabled={!selectedTrain || !manualAction}>
                      Execute Action
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Active Trains ({trains.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {trains.map(train => (
                      <div key={train.id} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <div className="font-medium text-sm">{train.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {train.number} • {train.currentStation} → {train.nextStation}
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant={train.status === 'on_time' ? 'default' : 'destructive'} className="text-xs">
                            {train.status.replace('_', ' ')}
                          </Badge>
                          <div className="text-xs text-muted-foreground mt-1">
                            {train.speed} km/h • Delay: {train.delay}m
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </div>
  )
}
