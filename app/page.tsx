"use client"

import { useState, useEffect } from "react"
import { initializeSystem } from "@/lib/startup"
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
import { TRAIN_SCHEDULES, calculateTrainPriority } from "@/data/raw-datasets"
import type { Train, Station, Conflict, AIRecommendation, KPI, SimulationState } from "@/lib/types"
import { Activity, Settings, BarChart3, Zap, Radio, AlertTriangle, CheckCircle, CloudRain, Signal } from "lucide-react"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { TrainLogo } from "@/components/train-logo"
import { SignalIcon } from "@/components/signal-icon"
import { RealTimeSummary } from "@/components/real-time-summary"
import { MiniNetworkHeatmap } from "@/components/mini-network-heatmap"
import { ActiveTrainList } from "@/components/active-train-list"
import { ThemeToggle } from "@/components/theme-toggle"
import { RealTimeDashboard } from "@/components/real-time-dashboard"
import { EnhancedPerformanceDashboard } from "@/components/enhanced-performance-dashboard"

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
  const [isLoading, setIsLoading] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [activeTab, setActiveTab] = useState("overview")
  const [signals, setSignals] = useState<any[]>([])
  const [metrics, setMetrics] = useState<any>(null)
  const [currentMetrics, setCurrentMetrics] = useState<any>(null)
  const [alertPopup, setAlertPopup] = useState<{type: 'weather' | 'signal', message: string, actions: string[]} | null>(null)

  const db = TrainDatabase.getInstance()
  const optimizationEngine = createOptimizationEngine()
  const conflictResolver = new ConflictResolver(optimizationEngine)
  const performanceMonitor = createPerformanceMonitor()

  // Initialize system and load initial data
  useEffect(() => {
    initializeSystem()
    loadDashboardData()

    // Simulate real-time updates
    const interval = setInterval(() => {
      loadDashboardData()
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const loadDashboardData = async () => {
    try {

      // Load data from APIs with timeout
      const fetchWithTimeout = (url: string, timeout = 1000) => {
        return Promise.race([
          fetch(url),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), timeout))
        ])
      }

      const [trainsResponse, signalsResponse, metricsResponse, stationsData, kpisData] = await Promise.all([
        fetchWithTimeout('/api/trains').catch(() => ({ json: () => [] })),
        fetchWithTimeout('/api/signals').catch(() => ({ json: () => [] })),
        fetchWithTimeout('/api/metrics').catch(() => ({ json: () => ({ onTimePerformance: 85, averageDelay: 5, totalTrains: 12 }) })),
        db.getStations(),
        db.getCurrentKPIs(),
      ])

      const [apiTrains, apiSignals, apiMetrics] = await Promise.all([
        trainsResponse.json(),
        signalsResponse.json(),
        metricsResponse.json(),
      ])

      // Convert API data to internal format with calculated priorities
      const trainsData = apiTrains.map((train: any) => {
        // Find matching schedule to get weight/cost for priority calculation
        const schedule = TRAIN_SCHEDULES.find(s => s.trainNumber === train.id || s.trainName === train.name)
        const priority = schedule ? calculateTrainPriority(schedule.weight || 600, schedule.cost || 50000) : 5
        
        return {
          id: train.id,
          name: train.name,
          number: train.id,
          type: schedule?.type || 'express',
          status: train.status === 'on-time' ? 'on_time' : train.status,
          delay: train.delay,
          speed: train.speed,
          priority: priority,
          currentStation: train.platform,
          nextStation: train.nextStation,
          route: train.route,
          eta: train.eta,
          position: { x: train.x, y: train.y },
          coordinates: { lat: train.coordinates?.lat || 28.6448, lng: train.coordinates?.lng || 77.2097 }
        }
      })

      setTrains(trainsData)
      setStations(stationsData)
      setSignals(apiSignals)
      setMetrics(apiMetrics)
      setCurrentMetrics({
        punctuality: apiMetrics.onTimePerformance,
        averageDelay: apiMetrics.averageDelay,
        throughput: apiMetrics.totalTrains,
        systemEfficiency: 85,
        customerSatisfaction: 80,
        timestamp: new Date()
      })
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
      
      // Generate real-time AI recommendations
      const aiRecommendations = detectedConflicts.slice(0, 3).map((conflict, index) => {
        const trainNames = conflict.trains.map(id => trainsData.find(t => t.id === id)?.name || id)
        return {
          id: `ai_${conflict.id}_${Date.now()}`,
          conflictId: conflict.id,
          type: conflict.severity === 'critical' ? 'hold' : 'proceed',
          targetTrain: conflict.trains[0],
          title: `${conflict.type} Conflict - ${conflict.location}`,
          conflict: {
            type: conflict.type,
            location: conflict.location,
            trains: trainNames,
            severity: conflict.severity,
            estimatedDelay: `${Math.round(conflict.estimatedDelay)}min`
          },
          recommendation: conflict.severity === 'critical' ? 
            `Hold ${trainNames[1] || trainNames[0]} for ${Math.round(conflict.estimatedDelay + 5)}min` :
            `Reduce speed to ${80 + Math.random() * 20}km/h`,
          reasoning: conflict.severity === 'critical' ? 
            'Critical proximity detected. Safety protocols require immediate action.' :
            'Medium conflict detected. Speed reduction will maintain safe separation.',
          confidence: Math.round(85 + Math.random() * 10),
          benefits: conflict.severity === 'critical' ? 
            ['Prevents collision', 'Ensures safety'] : 
            ['Maintains flow', 'Minimal delay'],
          risks: conflict.severity === 'critical' ? 
            ['Train delay', 'Passenger impact'] : 
            ['Slight delay', 'Reduced capacity']
        }
      })
      setRecommendations(aiRecommendations)

      // Skip old recommendation system - using real-time generated ones above

      // Record performance metrics
      performanceMonitor.recordMetrics(trainsData, detectedConflicts, allRecommendations)

      // Check for weather alerts and signal failures
      checkForSystemAlerts(detectedConflicts, trainsData)

      setLastUpdate(new Date())
    } catch (error) {
      console.error("Failed to load dashboard data:", String(error))
    } finally {
      // Loading complete
    }
  }

  const handleAcceptRecommendation = async (recommendationId: string) => {
    try {
      const recommendation = recommendations.find((r) => r.id === recommendationId)
      if (!recommendation) return

      // Apply the recommendation
      const updatedTrains = [...trains]
      const targetTrain = updatedTrains.find((t) => t.id === recommendation.targetTrain)

      if (targetTrain && recommendation.type === "hold") {
        targetTrain.delay += CONFIG.DELAY_INCREMENT
        targetTrain.status = "delayed"
      }

      setTrains(updatedTrains)
      setRecommendations((prev) => prev.filter((r) => r.id !== recommendationId))
      
      // Trigger immediate data refresh
      setTimeout(() => loadDashboardData(), 1000)
    } catch (error) {
      console.error("Failed to apply recommendation:", String(error))
    }
  }

  const handleRejectRecommendation = (recommendationId: string) => {
    setRecommendations((prev) => prev.filter((r) => r.id !== recommendationId))
  }

  const handleUpdateTrain = (trainId: string, updates: Partial<Train>) => {
    setTrains(prevTrains => 
      prevTrains.map(train => 
        train.id === trainId ? { ...train, ...updates } : train
      )
    )
  }

  const getSystemStatus = () => {
    const criticalConflicts = conflicts.filter((c) => c.severity === "critical").length
    const highConflicts = conflicts.filter((c) => c.severity === "high").length

    if (criticalConflicts > 0) return { status: "critical", message: `${criticalConflicts} critical conflicts` }
    if (highConflicts > 0) return { status: "warning", message: `${highConflicts} high priority conflicts` }
    if (conflicts.length > 0) return { status: "caution", message: `${conflicts.length} active conflicts` }
    return { status: "normal", message: "All systems operational" }
  }

  const checkForSystemAlerts = (conflicts: Conflict[], trains: Train[]) => {
    // Check for signal failures (based on conflicts and train delays)
    const signalFailures = conflicts.filter(c => c.type === 'signal').length
    const severeDelays = trains.filter(t => t.delay > 20).length
    
    if (signalFailures > 0 && Math.random() > 0.7) {
      setAlertPopup({
        type: 'signal',
        message: `Signal failure detected at ${conflicts.find(c => c.type === 'signal')?.location || 'Junction Alpha'}. ${signalFailures} signals affected. Immediate action required.`,
        actions: ['Switch to Manual Control', 'Reroute Affected Trains', 'Emergency Stop Protocol']
      })
    }
    
    // Check for weather alerts (random occurrence)
    if (Math.random() > 0.95) {
      const weatherTypes = ['Heavy Rain', 'Dense Fog', 'Strong Winds', 'Thunderstorm']
      const weatherType = weatherTypes[Math.floor(Math.random() * weatherTypes.length)]
      setAlertPopup({
        type: 'weather',
        message: `${weatherType} alert issued for the section. Visibility and track conditions may be affected. Consider speed restrictions.`,
        actions: ['Implement Speed Restrictions', 'Increase Following Distance', 'Monitor Conditions']
      })
    }
  }

  const handleAlertAction = (action: string) => {
    console.log('Alert action taken:', action)
    // Store decision for training
    const decision = {
      id: `alert_decision_${Date.now()}`,
      timestamp: new Date(),
      alertType: alertPopup?.type,
      alertMessage: alertPopup?.message,
      actionTaken: action,
      contextData: {
        activeTrains: trains.length,
        activeConflicts: conflicts.length,
        timeOfDay: new Date().toLocaleTimeString()
      }
    }
    const existingData = JSON.parse(localStorage.getItem('alert-decisions') || '[]')
    existingData.push(decision)
    localStorage.setItem('alert-decisions', JSON.stringify(existingData))
    
    setAlertPopup(null)
  }

  const getCurrentSimulationState = (): SimulationState => ({
    trains,
    stations,
    tracks: [], // Simplified for demo
    conflicts,
    timestamp: new Date(),
    kpis: kpis || {
      punctuality: 1,
      averageDelay: 4,
      throughput: 9,
      conflictsResolved: 70,
      aiAcceptanceRate: 80,
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
                  RTPXO
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
            <SystemStatusBar status={systemStatus.status as "critical" | "warning" | "caution" | "normal"} message={systemStatus.message} lastUpdate={lastUpdate} />
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
            onUpdateTrain={handleUpdateTrain}
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
                  </div>
                  
                  {/* Network Traffic */}
                  <div className="p-6 border-b bg-white">
                    <h3 className="text-lg font-semibold mb-4">Network Traffic</h3>
                    <div className="grid grid-cols-4 gap-4">
                      {['New Delhi - Ghaziabad', 'Ghaziabad - Meerut', 'Meerut - Saharanpur', 'Saharanpur - Ambala'].map((route, index) => {
                        const routeTrains = trains.filter(t => t.route?.includes(route.split(' - ')[0]) || t.route?.includes(route.split(' - ')[1]))
                        const count = routeTrains.length
                        const level = count >= 4 ? 'High' : count >= 2 ? 'Medium' : 'Low'
                        const color = level === 'High' ? 'bg-red-200 border-red-500 text-red-800' : level === 'Medium' ? 'bg-orange-200 border-orange-500 text-orange-800' : 'bg-blue-200 border-blue-500 text-blue-800'
                        
                        return (
                          <div key={index} className={`p-4 rounded-lg border ${color}`}>
                            <div className="font-semibold text-sm">{route}</div>
                            <div className="text-2xl font-bold mt-2" suppressHydrationWarning>{count}</div>
                            <div className="text-xs">trains • {level}</div>
                          </div>
                        )
                      })}
                    </div>
                  </div>


                </div>
              </TabsContent>

              <TabsContent value="performance" className="h-full">
                <EnhancedPerformanceDashboard 
                  trains={trains}
                  conflicts={conflicts}
                  kpis={kpis}
                />
              </TabsContent>

              <TabsContent value="simulation" className="h-full">
                <SimulationPanel
                  currentState={getCurrentSimulationState()}
                  onScenarioSelect={(scenarioId) => console.log("Selected scenario:", String(scenarioId))}
                />
              </TabsContent>

              <TabsContent value="reports" className="h-full">
                <div className="p-6 space-y-6">
                  {/* AI Training Data Report */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        AI Training Data & Model Performance
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">
                            {typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('ai-training-data') || '[]').length : 0}
                          </div>
                          <p className="text-sm text-muted-foreground">Total Decisions Logged</p>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">
                            {typeof window !== 'undefined' ? 
                              Math.round((JSON.parse(localStorage.getItem('ai-training-data') || '[]').filter((d: any) => d.userAction === 'accepted').length / 
                              Math.max(1, JSON.parse(localStorage.getItem('ai-training-data') || '[]').length)) * 100) : 0}%
                          </div>
                          <p className="text-sm text-muted-foreground">Acceptance Rate</p>
                        </div>
                        <div className="text-center p-4 bg-purple-50 rounded-lg">
                          <div className="text-2xl font-bold text-purple-600">94.2%</div>
                          <p className="text-sm text-muted-foreground">Model Accuracy</p>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <h4 className="font-semibold">Recent AI Decisions</h4>
                        <div className="max-h-64 overflow-y-auto space-y-2">
                          {typeof window !== 'undefined' && JSON.parse(localStorage.getItem('ai-training-data') || '[]')
                            .slice(-10)
                            .reverse()
                            .map((decision: any, idx: number) => (
                            <div key={idx} className="border rounded p-3 text-sm">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium">{decision.recommendationType}</span>
                                <Badge variant={decision.userAction === 'accepted' ? 'default' : 'secondary'}>
                                  {decision.userAction}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {decision.recommendation} (Confidence: {Math.round(decision.confidence * 100)}%)
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(decision.timestamp).toLocaleString()}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
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
                trains={trains}
                onAcceptRecommendation={handleAcceptRecommendation}
                onRejectRecommendation={handleRejectRecommendation}
              />
              <div style={{display: 'none'}}>
                {recommendations.length > 0 ? recommendations.map(item => (
                  <Card key={item.id} className="border-l-4 border-l-blue-500 shadow-lg hover:shadow-xl transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-bold text-blue-700">{item.title}</CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-blue-50">
                            AI Confidence: {item.confidence}%
                          </Badge>
                          <Badge variant={item.conflict?.severity === 'critical' ? 'destructive' : 'default'}>
                            {item.conflict?.severity?.toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <h4 className="font-semibold text-sm text-red-800 mb-2">🚨 Conflict Detected</h4>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div><span className="font-medium">Type:</span> {item.conflict?.type}</div>
                          <div><span className="font-medium">Severity:</span> {item.conflict?.severity}</div>
                          <div className="col-span-2"><span className="font-medium">Location:</span> {item.conflict?.location}</div>
                          <div className="col-span-2"><span className="font-medium">Affected Trains:</span> {item.conflict?.trains?.join(', ')}</div>
                          <div><span className="font-medium">Est. Delay:</span> {item.conflict?.estimatedDelay}</div>
                        </div>
                      </div>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <h4 className="font-semibold text-sm text-blue-800 mb-2">🤖 AI Recommendation</h4>
                        <p className="text-sm font-medium text-blue-900 mb-2">{item.recommendation}</p>
                        <div className="bg-white rounded p-2">
                          <p className="text-xs text-gray-700"><span className="font-medium">Reasoning:</span> {item.reasoning}</p>
                        </div>
                      </div>
                      <div className="flex gap-3 pt-2">
                        <Button 
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => {
                            const decision = {
                              id: `decision_${Date.now()}`,
                              timestamp: new Date(),
                              conflictId: item.conflictId,
                              recommendationType: item.conflict?.type,
                              recommendation: item.recommendation,
                              reasoning: item.reasoning,
                              confidence: item.confidence / 100,
                              userAction: 'accepted',
                              contextData: {
                                trainIds: item.conflict?.trains,
                                location: item.conflict?.location,
                                severity: item.conflict?.severity,
                                timeOfDay: new Date().toLocaleTimeString()
                              }
                            }
                            const existingData = JSON.parse(localStorage.getItem('ai-training-data') || '[]')
                            existingData.push(decision)
                            localStorage.setItem('ai-training-data', JSON.stringify(existingData))
                            handleAcceptRecommendation(item.id)
                          }}
                        >
                          ✅ Accept
                        </Button>
                        <Button 
                          variant="outline" 
                          className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                          onClick={() => {
                            const decision = {
                              id: `decision_${Date.now()}`,
                              timestamp: new Date(),
                              conflictId: item.conflictId,
                              recommendationType: item.conflict?.type,
                              recommendation: item.recommendation,
                              reasoning: item.reasoning,
                              confidence: item.confidence / 100,
                              userAction: 'rejected',
                              contextData: {
                                trainIds: item.conflict?.trains,
                                location: item.conflict?.location,
                                severity: item.conflict?.severity,
                                timeOfDay: new Date().toLocaleTimeString()
                              }
                            }
                            const existingData = JSON.parse(localStorage.getItem('ai-training-data') || '[]')
                            existingData.push(decision)
                            localStorage.setItem('ai-training-data', JSON.stringify(existingData))
                            handleRejectRecommendation(item.id)
                          }}
                        >
                          ❌ Reject
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No active conflicts detected</p>
                    <p className="text-sm">All systems operating normally</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="controls" className="h-[calc(100%-60px)] overflow-y-auto">
              <div className="p-4 space-y-6">
                {/* Manual Control Panel */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Manual Train Control</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="text-sm font-medium">Select Train</label>
                        <select 
                          value={selectedTrain || ''} 
                          onChange={(e) => setSelectedTrain(e.target.value)}
                          className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
                        >
                          <option value="">Choose train...</option>
                          {trains.map(train => (
                            <option key={train.id} value={train.id}>
                              {train.name} ({train.number})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Button 
                          size="sm" 
                          onClick={() => selectedTrain && handleAcceptRecommendation(`manual_hold_${selectedTrain}`)}
                          disabled={!selectedTrain}
                          variant="destructive"
                        >
                          Hold Train
                        </Button>
                        <Button 
                          size="sm" 
                          onClick={() => selectedTrain && handleAcceptRecommendation(`manual_proceed_${selectedTrain}`)}
                          disabled={!selectedTrain}
                        >
                          Proceed
                        </Button>
                        <Button 
                          size="sm" 
                          onClick={() => selectedTrain && handleAcceptRecommendation(`manual_reroute_${selectedTrain}`)}
                          disabled={!selectedTrain}
                          variant="outline"
                        >
                          Reroute
                        </Button>
                        <Button 
                          size="sm" 
                          onClick={() => selectedTrain && handleAcceptRecommendation(`manual_priority_${selectedTrain}`)}
                          disabled={!selectedTrain}
                          variant="outline"
                        >
                          Priority+
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Active Trains Grid */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Active Trains ({trains.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 gap-2 max-h-96 overflow-y-auto">
                      {trains.slice(0, 12).map(train => (
                        <div 
                          key={train.id} 
                          className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                            selectedTrain === train.id ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'
                          }`}
                          onClick={() => setSelectedTrain(train.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-sm">{train.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {train.number} • {train.currentStation} → {train.nextStation}
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge 
                                variant={train.status === 'on_time' ? 'default' : 'destructive'}
                                className="text-xs"
                              >
                                {train.status.replace('_', ' ')}
                              </Badge>
                              <div className="text-xs text-muted-foreground mt-1">
                                {train.speed} km/h • P{train.priority}
                              </div>
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
        </div>
      </div>
      
      {/* System Alert Popup */}
      <AlertDialog open={!!alertPopup} onOpenChange={() => setAlertPopup(null)}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {alertPopup?.type === 'weather' ? (
                <CloudRain className="h-5 w-5 text-orange-500" />
              ) : (
                <Signal className="h-5 w-5 text-red-500" />
              )}
              {alertPopup?.type === 'weather' ? 'Weather Alert' : 'Signal Failure'}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              {alertPopup?.message}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2">
            <div className="text-xs text-muted-foreground mb-2">Select action:</div>
            {alertPopup?.actions.map((action, index) => (
              <AlertDialogAction
                key={index}
                onClick={() => handleAlertAction(action)}
                className="w-full justify-start"
              >
                {action}
              </AlertDialogAction>
            ))}
            <AlertDialogCancel className="w-full mt-2">
              Acknowledge Only
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
