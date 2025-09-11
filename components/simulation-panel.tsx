"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import type { SimulationScenario, SimulationResult, WhatIfAnalysis, SimulationState } from "@/lib/simulation-engine"
import { createSimulationEngine } from "@/lib/simulation-engine"
import { Play, Pause, TrendingUp, TrendingDown, Clock, CheckCircle, Zap, BarChart3, Settings, Plus } from "lucide-react"

interface SimulationPanelProps {
  currentState: SimulationState
  onScenarioSelect?: (scenarioId: string) => void
}

export function SimulationPanel({ currentState, onScenarioSelect }: SimulationPanelProps) {
  const [simulationEngine] = useState(() => createSimulationEngine())
  const [scenarios, setScenarios] = useState<SimulationScenario[]>([])
  const [results, setResults] = useState<SimulationResult[]>([])
  const [activeSimulation, setActiveSimulation] = useState<string | null>(null)
  const [simulationProgress, setSimulationProgress] = useState(0)
  const [whatIfAnalysis, setWhatIfAnalysis] = useState<WhatIfAnalysis | null>(null)
  const [selectedScenarios, setSelectedScenarios] = useState<string[]>([])

  // New scenario creation state
  const [newScenario, setNewScenario] = useState({
    name: "",
    description: "",
    duration: 120,
    modifications: [] as any[],
  })

  useEffect(() => {
    // Load predefined scenarios
    const predefinedScenarios = simulationEngine.createPredefinedScenarios(currentState)
    setScenarios(predefinedScenarios)
  }, [currentState, simulationEngine])

  const runSimulation = async (scenarioId: string) => {
    setActiveSimulation(scenarioId)
    setSimulationProgress(0)

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setSimulationProgress((prev) => Math.min(prev + 10, 90))
      }, 200)

      const result = await simulationEngine.runSimulation(scenarioId)

      clearInterval(progressInterval)
      setSimulationProgress(100)

      setResults((prev) => {
        const filtered = prev.filter((r) => r.scenarioId !== scenarioId)
        return [...filtered, result]
      })

      setTimeout(() => {
        setActiveSimulation(null)
        setSimulationProgress(0)
      }, 1000)
    } catch (error) {
      console.error("Simulation failed:", error)
      setActiveSimulation(null)
      setSimulationProgress(0)
    }
  }

  const runWhatIfAnalysis = async () => {
    if (selectedScenarios.length < 2) return

    const modifications = selectedScenarios.map((scenarioId) => {
      const scenario = scenarios.find((s) => s.id === scenarioId)
      return scenario?.modifications || []
    })

    try {
      const analysis = await simulationEngine.performWhatIfAnalysis(
        "Compare selected scenarios",
        currentState,
        modifications,
      )
      setWhatIfAnalysis(analysis)
    } catch (error) {
      console.error("What-if analysis failed:", error)
    }
  }

  const createCustomScenario = () => {
    if (!newScenario.name) return

    const scenario = simulationEngine.createScenario(
      newScenario.name,
      newScenario.description,
      currentState,
      newScenario.modifications,
      newScenario.duration,
    )

    setScenarios((prev) => [...prev, scenario])
    setNewScenario({ name: "", description: "", duration: 120, modifications: [] })
  }

  const getResultStatus = (result: SimulationResult) => {
    const improvements = result.kpiComparison.improvements
    if (improvements.punctuality > 5 && improvements.averageDelay > 2) return "excellent"
    if (improvements.punctuality > 0 || improvements.averageDelay > 0) return "good"
    if (improvements.punctuality < -5 || improvements.averageDelay < -5) return "poor"
    return "neutral"
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "excellent":
        return "text-primary"
      case "good":
        return "text-chart-1"
      case "neutral":
        return "text-muted-foreground"
      case "poor":
        return "text-destructive"
      default:
        return "text-muted-foreground"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "excellent":
        return <TrendingUp className="h-4 w-4 text-primary" />
      case "good":
        return <TrendingUp className="h-4 w-4 text-chart-1" />
      case "neutral":
        return <BarChart3 className="h-4 w-4 text-muted-foreground" />
      case "poor":
        return <TrendingDown className="h-4 w-4 text-destructive" />
      default:
        return <BarChart3 className="h-4 w-4 text-muted-foreground" />
    }
  }

  return (
    <div className="h-full flex flex-col">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          Simulation & What-If Analysis
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 p-0">
        <Tabs defaultValue="scenarios" className="h-full">
          <TabsList className="grid w-full grid-cols-3 m-4 mb-0">
            <TabsTrigger value="scenarios">Scenarios</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
            <TabsTrigger value="whatif">What-If</TabsTrigger>
          </TabsList>

          <TabsContent value="scenarios" className="h-[calc(100%-60px)] overflow-y-auto">
            <div className="p-4 space-y-4">
              {/* Create New Scenario */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Create Custom Scenario
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label htmlFor="scenario-name" className="text-xs">
                      Scenario Name
                    </Label>
                    <Input
                      id="scenario-name"
                      placeholder="e.g., Rush Hour Delay"
                      value={newScenario.name}
                      onChange={(e) => setNewScenario((prev) => ({ ...prev, name: e.target.value }))}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="scenario-description" className="text-xs">
                      Description
                    </Label>
                    <Input
                      id="scenario-description"
                      placeholder="Brief description of the scenario"
                      value={newScenario.description}
                      onChange={(e) => setNewScenario((prev) => ({ ...prev, description: e.target.value }))}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="scenario-duration" className="text-xs">
                      Duration (minutes)
                    </Label>
                    <Input
                      id="scenario-duration"
                      type="number"
                      min="30"
                      max="480"
                      value={newScenario.duration}
                      onChange={(e) =>
                        setNewScenario((prev) => ({ ...prev, duration: Number.parseInt(e.target.value) || 120 }))
                      }
                      className="mt-1"
                    />
                  </div>

                  <Button size="sm" onClick={createCustomScenario} disabled={!newScenario.name} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Scenario
                  </Button>
                </CardContent>
              </Card>

              {/* Predefined Scenarios */}
              <div className="space-y-3">
                <h3 className="font-medium text-sm">Available Scenarios</h3>
                {scenarios.map((scenario) => {
                  const result = results.find((r) => r.scenarioId === scenario.id)
                  const isRunning = activeSimulation === scenario.id

                  return (
                    <Card key={scenario.id} className="border-l-4 border-l-primary">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium text-sm">{scenario.name}</h4>
                              <p className="text-xs text-muted-foreground text-balance">{scenario.description}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              {result && getStatusIcon(getResultStatus(result))}
                              <Badge variant="outline" className="text-xs">
                                {scenario.duration}m
                              </Badge>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Settings className="h-3 w-3" />
                            <span>{scenario.modifications.length} modifications</span>
                            <Clock className="h-3 w-3 ml-2" />
                            <span>Created {scenario.createdAt.toLocaleDateString()}</span>
                          </div>

                          {isRunning && (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-xs">
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
                                <span>Running simulation...</span>
                              </div>
                              <Progress value={simulationProgress} className="h-2" />
                            </div>
                          )}

                          {result && !isRunning && (
                            <div className="space-y-2">
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Punctuality:</span>
                                  <span className={getStatusColor(getResultStatus(result))}>
                                    {result.kpiComparison.improvements.punctuality > 0 ? "+" : ""}
                                    {result.kpiComparison.improvements.punctuality.toFixed(1)}%
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Avg Delay:</span>
                                  <span className={getStatusColor(getResultStatus(result))}>
                                    {result.kpiComparison.improvements.averageDelay > 0 ? "-" : "+"}
                                    {Math.abs(result.kpiComparison.improvements.averageDelay).toFixed(1)}m
                                  </span>
                                </div>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">Conflicts:</span>
                                <span>{result.conflicts.length} detected</span>
                              </div>
                            </div>
                          )}

                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => runSimulation(scenario.id)}
                              disabled={isRunning}
                              className="flex-1"
                            >
                              {isRunning ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                              {isRunning ? "Running..." : result ? "Re-run" : "Run"}
                            </Button>

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const isSelected = selectedScenarios.includes(scenario.id)
                                if (isSelected) {
                                  setSelectedScenarios((prev) => prev.filter((id) => id !== scenario.id))
                                } else {
                                  setSelectedScenarios((prev) => [...prev, scenario.id])
                                }
                              }}
                              className={
                                selectedScenarios.includes(scenario.id)
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-transparent"
                              }
                            >
                              {selectedScenarios.includes(scenario.id) ? (
                                <CheckCircle className="h-4 w-4" />
                              ) : (
                                <Plus className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="results" className="h-[calc(100%-60px)] overflow-y-auto">
            <div className="p-4 space-y-4">
              {results.length === 0 ? (
                <Alert>
                  <BarChart3 className="h-4 w-4" />
                  <AlertDescription>No simulation results yet. Run a scenario to see results.</AlertDescription>
                </Alert>
              ) : (
                results.map((result) => {
                  const scenario = scenarios.find((s) => s.id === result.scenarioId)
                  const status = getResultStatus(result)

                  return (
                    <Card key={result.scenarioId}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm">{scenario?.name || "Unknown Scenario"}</CardTitle>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(status)}
                            <Badge variant={result.success ? "default" : "destructive"}>
                              {result.success ? "Success" : "Issues"}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground text-xs">Punctuality Change</p>
                            <p className={`font-medium ${getStatusColor(status)}`}>
                              {result.kpiComparison.improvements.punctuality > 0 ? "+" : ""}
                              {result.kpiComparison.improvements.punctuality.toFixed(1)}%
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">Delay Change</p>
                            <p className={`font-medium ${getStatusColor(status)}`}>
                              {result.kpiComparison.improvements.averageDelay > 0 ? "-" : "+"}
                              {Math.abs(result.kpiComparison.improvements.averageDelay).toFixed(1)}m
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">Throughput</p>
                            <p className="font-medium">
                              {result.kpiComparison.improvements.throughput > 0 ? "+" : ""}
                              {result.kpiComparison.improvements.throughput.toFixed(1)}/h
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">Conflicts</p>
                            <p className="font-medium">{result.conflicts.length} detected</p>
                          </div>
                        </div>

                        <div className="text-xs text-muted-foreground">
                          <div className="flex justify-between">
                            <span>Execution Time:</span>
                            <span>{result.executionTime}ms</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Timeline Events:</span>
                            <span>{result.timeline.length}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })
              )}
            </div>
          </TabsContent>

          <TabsContent value="whatif" className="h-[calc(100%-60px)] overflow-y-auto">
            <div className="p-4 space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Compare Scenarios</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-xs text-muted-foreground">
                    Select 2 or more scenarios to compare their outcomes and get AI recommendations.
                  </p>

                  <div className="text-xs">
                    <span className="text-muted-foreground">Selected: </span>
                    <span className="font-medium">{selectedScenarios.length} scenarios</span>
                  </div>

                  <Button
                    size="sm"
                    onClick={runWhatIfAnalysis}
                    disabled={selectedScenarios.length < 2}
                    className="w-full"
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Run What-If Analysis
                  </Button>
                </CardContent>
              </Card>

              {whatIfAnalysis && (
                <Card className="border-l-4 border-l-primary">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Analysis Results</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">AI Recommendation:</p>
                      <p className="text-sm text-balance">{whatIfAnalysis.recommendation}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Confidence:</span>
                      <Badge variant="outline">{Math.round(whatIfAnalysis.confidence * 100)}%</Badge>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">Scenario Comparison:</p>
                      {whatIfAnalysis.results.map((result, index) => (
                        <div key={result.scenarioId} className="flex items-center justify-between text-xs">
                          <span>Scenario {index + 1}</span>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(getResultStatus(result))}
                            <span className={getStatusColor(getResultStatus(result))}>
                              {result.kpiComparison.improvements.punctuality.toFixed(1)}% punctuality
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </div>
  )
}
