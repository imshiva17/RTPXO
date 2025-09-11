"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { NetworkMap } from "@/components/network-map"
import { TrainStatusPanel } from "@/components/train-status-panel"
import { AIRecommendationsPanel } from "@/components/ai-recommendations-panel"
import { ControlActionsPanel } from "@/components/control-actions-panel"
import { SystemStatusBar } from "@/components/system-status-bar"
import { SimulationPanel } from "@/components/simulation-panel"
import { PerformanceDashboard } from "@/components/performance-dashboard"
import { TrainDatabase } from "@/lib/database"
import { createOptimizationEngine } from "@/lib/optimization-engine"
import { ConflictResolver } from "@/lib/conflict-resolver"
import { createPerformanceMonitor } from "@/lib/performance-monitor"
import type { Train, Station, Conflict, AIRecommendation, KPI, SimulationState } from "@/lib/types"
import { Activity, Settings, BarChart3, Zap, Radio } from "lucide-react"
import { TrainLogo } from "@/components/train-logo"
import { SignalIcon } from "@/components/signal-icon"
import { RealTimeSummary } from "@/components/real-time-summary"
import { MiniNetworkHeatmap } from "@/components/mini-network-heatmap"
import { ActiveTrainList } from "@/components/active-train-list"
import { AlertConflictFeed } from "@/components/alert-conflict-feed"
import { ThemeToggle } from "@/components/theme-toggle"

// Configuration constants
const CONFIG = {
  DELAY_INCREMENT: 5,
  SYSTEM_EFFICIENCY: 85,
  RESOURCE_UTILIZATION: 75,
  CUSTOMER_SATISFACTION: 80,
  UPDATE_INTERVAL: 30000,
} as const

export default function ControllerDashboard() {
  const [trains, setTrains] = useState<Train[]>([])
  const [stations, setStations] = useState<Station[]>([])
  const [conflicts, setConflicts] = useState<Conflict[]>([])
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([])
  const [kpis, setKPIs] = useState<KPI | null>(null)
  const [selectedTrain, setSelectedTrain] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [activeTab, setActiveTab] = useState("overview")
  const [signals, setSignals] = useState<any[]>([])
  const [metrics, setMetrics] = useState<any>(null)

  const db = TrainDatabase.getInstance()
  const optimizationEngine = createOptimizationEngine()
  const conflictResolver = new ConflictResolver(optimizationEngine)
  const performanceMonitor = createPerformanceMonitor()

  // Load initial data and set up real-time updates
  useEffect(() => {
    loadDashboardData()

    // Simulate real-time updates
    const interval = setInterval(() => {
      loadDashboardData()
    }, CONFIG.UPDATE_INTERVAL)

    return () => clearInterval(interval)
  }, [])

  const loadDashboardData = async () => {
    try {
      setIsLoading(true)

      // Load data from APIs
      const [trainsResponse, signalsResponse, metricsResponse, stationsData, kpisData] = await Promise.all([
        fetch('/api/trains'),
        fetch('/api/signals'),
        fetch('/api/metrics'),
        db.getStations(),
        db.getCurrentKPIs(),
      ])

      const [apiTrains, apiSignals, apiMetrics] = await Promise.all([
        trainsResponse.json(),
        signalsResponse.json(),
        metricsResponse.json(),
      ])

      // Convert API data to internal format
      const trainsData = apiTrains.map((train: any) => ({
        id: train.id,
        name: train.name,
        number: train.id,
        type: 'express',
        status: train.status === 'on-time' ? 'on_time' : train.status,
        delay: train.delay,
        speed: train.speed,
        priority: 1,
        currentStation: train.platform,
        nextStation: train.nextStation,
        route: train.route,
        eta: train.eta,
        position: { x: train.x, y: train.y },
      }))

      setTrains(trainsData)
      setStations(stationsData)
      setSignals(apiSignals)
      setMetrics(apiMetrics)
      setKPIs({
        punctuality: apiMetrics.onTimePerformance,
        averageDelay: apiMetrics.averageDelay,
        throughput: apiMetrics.totalTrains,
        conflictsResolved: 0,
        aiAcceptanceRate: 85,
      })

      // Detect conflicts
      const detectedConflicts = optimizationEngine.detectConflicts(trainsData, stationsData, [])
      setConflicts(detectedConflicts)

      // Generate AI recommendations for conflicts (batch processing)
      const conflictIds = detectedConflicts.map(conflict => conflict.id)
      const recommendationPromises = conflictIds.map(id => db.getAIRecommendations(id))
      const recommendationResults = await Promise.all(recommendationPromises)
      const allRecommendations = recommendationResults.flat()
      setRecommendations(allRecommendations)

      // Record performance metrics
      performanceMonitor.recordMetrics(trainsData, detectedConflicts, allRecommendations)

      setLastUpdate(new Date())
    } catch (error) {
      console.error("Failed to load dashboard data:", String(error))
    } finally {
      setIsLoading(false)
    }
  }

  const handleAcceptRecommendation = async (recommendationId: string) => {
    try {
      const recommendation = recommendations.find((r) => r.id === recommendationId)
      if (!recommendation) return

      // Simulate applying the recommendation
      const updatedTrains = [...trains]
      const targetTrain = updatedTrains.find((t) => t.id === recommendation.targetTrain)

      if (targetTrain && recommendation.type === "hold") {
        targetTrain.delay += CONFIG.DELAY_INCREMENT
        targetTrain.status = "delayed"
      }

      setTrains(updatedTrains)

      // Remove the applied recommendation
      setRecommendations((prev) => prev.filter((r) => r.id !== recommendationId))

      // Refresh conflicts immediately after applying recommendation
      const newConflicts = optimizationEngine.detectConflicts(updatedTrains, stations, [])
      setConflicts(newConflicts)
    } catch (error) {
      console.error("Failed to apply recommendation:", String(error))
    }
  }

  const handleRejectRecommendation = (recommendationId: string) => {
    setRecommendations((prev) => prev.filter((r) => r.id !== recommendationId))
  }

  const getSystemStatus = () => {
    const criticalConflicts = conflicts.filter((c) => c.severity === "critical").length
    const highConflicts = conflicts.filter((c) => c.severity === "high").length

    if (criticalConflicts > 0) return { status: "critical", message: `${criticalConflicts} critical conflicts` }
    if (highConflicts > 0) return { status: "warning", message: `${highConflicts} high priority conflicts` }
    if (conflicts.length > 0) return { status: "caution", message: `${conflicts.length} active conflicts` }
    return { status: "normal", message: "All systems operational" }
  }

  const getCurrentSimulationState = (): SimulationState => ({
    trains,
    stations,
    tracks: [], // Simplified for demo
    conflicts,
    timestamp: new Date(),
    kpis: kpis || {
      punctuality: 0,
      averageDelay: 0,
      throughput: 0,
      conflictsResolved: 0,
      aiAcceptanceRate: 0,
    },
  })

  const systemStatus = getSystemStatus()

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-gradient-to-r from-card via-primary/5 to-card shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 relative">
          {/* Railway track decoration */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20 overflow-hidden">
            <div className="h-full w-8 bg-gradient-to-r from-transparent via-primary to-transparent train-animation"></div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 p-2 bg-primary/10 rounded-lg">
                <TrainLogo className="h-10 w-10 text-primary" />
                <SignalIcon className="h-8 w-8 text-green-500" status="green" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                  Railway Traffic Controller
                  <Radio className="h-5 w-5 text-primary animate-pulse" />
                </h1>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <span>🚉 New Delhi - Ghaziabad Section</span>
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">LIVE</span>
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <SystemStatusBar status={systemStatus.status} message={systemStatus.message} lastUpdate={lastUpdate} />
            <ThemeToggle />
            <div className="flex items-center gap-2 mr-4">
              {signals.slice(0, 3).map((signal, index) => (
                <SignalIcon key={signal.id} className="h-6 w-6" status={signal.status} />
              ))}
            </div>
            <Button variant="outline" size="sm" className="border-primary text-primary hover:bg-primary hover:text-white">
              <Zap className="h-4 w-4 mr-2" />
              Inject Delay
            </Button>
            <Button variant="outline" size="sm" className="border-primary text-primary hover:bg-primary hover:text-white">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>
      </header>

      {/* Main Dashboard */}
      <div className="flex h-[calc(100vh-80px)]">
        {/* Left Sidebar - Train Status */}
        <div className="w-80 border-r bg-gradient-to-b from-card to-primary/5 overflow-y-auto relative">
          <div className="absolute top-0 right-0 w-1 h-full bg-gradient-to-b from-primary/20 to-transparent"></div>
          <div className="p-4 border-b bg-primary/10">
            <div className="flex items-center gap-2 mb-2">
              <TrainLogo className="h-6 w-6 text-primary" />
              <h2 className="font-semibold text-primary">Active Trains</h2>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>On Time</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span>Delayed</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span>Critical</span>
              </div>
            </div>
          </div>
          <TrainStatusPanel
            trains={trains}
            selectedTrain={selectedTrain}
            onSelectTrain={setSelectedTrain}
            isLoading={isLoading}
          />
        </div>

        {/* Center - Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Navigation Tabs */}
          <div className="border-b bg-card px-4">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
                  <Activity className="h-4 w-4" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="performance" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
                  <BarChart3 className="h-4 w-4" />
                  Performance
                </TabsTrigger>
                <TabsTrigger value="simulation" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
                  <Zap className="h-4 w-4" />
                  Simulation
                </TabsTrigger>
                <TabsTrigger value="reports" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
                  <Settings className="h-4 w-4" />
                  Reports
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Tab Content */}
          <div className="flex-1">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsContent value="overview" className="h-full">
                <div className="h-full flex flex-col">
                  {/* Real-Time Summary Block */}
                  <div className="p-6 pb-4 border-b bg-gradient-to-r from-primary/5 via-card to-primary/5 relative">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent"></div>
                    <RealTimeSummary trains={trains} conflicts={conflicts} kpis={kpis} lastUpdate={lastUpdate} />
                    {metrics && (
                      <div className="mt-4 grid grid-cols-4 gap-4 text-sm">
                        <div className="text-center">
                          <div className="font-semibold text-lg">{metrics.totalTrains}</div>
                          <div className="text-muted-foreground">Active Trains</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold text-lg">{metrics.onTimePerformance.toFixed(1)}%</div>
                          <div className="text-muted-foreground">On Time</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold text-lg">{metrics.averageDelay.toFixed(1)}m</div>
                          <div className="text-muted-foreground">Avg Delay</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold text-lg">{metrics.networkEfficiency.toFixed(1)}%</div>
                          <div className="text-muted-foreground">Efficiency</div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Main Content Grid */}
                  <div className="flex-1 p-6 grid grid-cols-12 gap-6">
                    {/* Left Column - Network Heatmap and Train List */}
                    <div className="col-span-8 space-y-6">
                      {/* Mini Network Heatmap */}
                      <div className="h-48">
                        <MiniNetworkHeatmap
                          trains={trains}
                          stations={stations}
                          conflicts={conflicts}
                          onExpandMap={() => setActiveTab("network")}
                        />
                      </div>

                      {/* Full Network Map */}
                      <Card className="flex-1 shadow-sm">
                        <CardHeader className="pb-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-lg font-semibold">Live Network Map</CardTitle>
                              <p className="text-sm text-muted-foreground mt-1">
                                Delhi-Mumbai Corridor • Last updated: {lastUpdate.toLocaleTimeString("en-IN")}
                              </p>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <div className="w-3 h-3 bg-primary rounded-full"></div>
                                <span>On Time</span>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <div className="w-3 h-3 bg-chart-3 rounded-full"></div>
                                <span>Delayed</span>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <div className="w-3 h-3 bg-destructive rounded-full"></div>
                                <span>Conflict</span>
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="p-0 h-[calc(100%-100px)]">
                          <NetworkMap
                            trains={trains}
                            stations={stations}
                            conflicts={conflicts}
                            selectedTrain={selectedTrain}
                            onSelectTrain={setSelectedTrain}
                          />
                        </CardContent>
                      </Card>
                    </div>

                    {/* Right Column - Active Trains and Alerts */}
                    <div className="col-span-4 space-y-6">
                      {/* Active Train List */}
                      <div className="h-96">
                        <ActiveTrainList
                          trains={trains}
                          stations={stations}
                          selectedTrain={selectedTrain}
                          onSelectTrain={setSelectedTrain}
                        />
                      </div>

                      {/* Alert & Conflict Feed */}
                      <div className="flex-1">
                        <AlertConflictFeed conflicts={conflicts} recommendations={recommendations} />
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="performance" className="h-full">
                <PerformanceDashboard
                  currentMetrics={
                    kpis
                      ? {
                          timestamp: new Date(),
                          punctuality: kpis.punctuality,
                          averageDelay: kpis.averageDelay,
                          throughput: kpis.throughput,
                          conflictsResolved: kpis.conflictsResolved,
                          aiAcceptanceRate: kpis.aiAcceptanceRate,
                          systemEfficiency: CONFIG.SYSTEM_EFFICIENCY,
                          resourceUtilization: CONFIG.RESOURCE_UTILIZATION,
                          customerSatisfaction: CONFIG.CUSTOMER_SATISFACTION,
                        }
                      : undefined
                  }
                  onRefresh={loadDashboardData}
                />
              </TabsContent>

              <TabsContent value="simulation" className="h-full">
                <SimulationPanel
                  currentState={getCurrentSimulationState()}
                  onScenarioSelect={(scenarioId) => console.log("Selected scenario:", String(scenarioId))}
                />
              </TabsContent>

              <TabsContent value="reports" className="h-full">
                <div className="p-8 text-center">
                  <BarChart3 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Reports & Analytics</h3>
                  <p className="text-muted-foreground mb-4">Detailed reporting and analytics dashboard</p>
                  <Badge variant="outline">Coming Soon</Badge>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Right Sidebar - AI Recommendations & Controls */}
        <div className="w-96 border-l bg-gradient-to-b from-card to-primary/5 relative">
          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary/20 to-transparent"></div>
          <Tabs defaultValue="recommendations" className="h-full">
            <div className="p-4 border-b bg-primary/10">
              <div className="flex items-center gap-2 mb-3">
                <Radio className="h-5 w-5 text-primary animate-pulse" />
                <h2 className="font-semibold text-primary">Control Center</h2>
              </div>
            </div>
            <TabsList className="grid w-full grid-cols-2 m-4 mb-0 bg-primary/10">
              <TabsTrigger value="recommendations" className="data-[state=active]:bg-primary data-[state=active]:text-white">AI Recommendations</TabsTrigger>
              <TabsTrigger value="controls" className="data-[state=active]:bg-primary data-[state=active]:text-white">Manual Controls</TabsTrigger>
            </TabsList>

            <TabsContent value="recommendations" className="h-[calc(100%-60px)] overflow-y-auto">
              <AIRecommendationsPanel
                recommendations={recommendations}
                conflicts={conflicts}
                onAcceptRecommendation={handleAcceptRecommendation}
                onRejectRecommendation={handleRejectRecommendation}
              />
            </TabsContent>

            <TabsContent value="controls" className="h-[calc(100%-60px)] overflow-y-auto">
              <ControlActionsPanel
                trains={trains}
                selectedTrain={selectedTrain}
                onTrainAction={(trainId, action) => {
                  console.log("Manual action:", String(action), "for train", String(trainId))
                }}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
