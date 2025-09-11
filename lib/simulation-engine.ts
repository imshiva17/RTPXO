// Advanced simulation and what-if analysis engine for train traffic scenarios

import type { Train, Station, Conflict, AIRecommendation, KPI, Track } from "./types"
import { TrainOptimizationEngine, OptimizationUtils } from "./optimization-engine"
import { ConflictResolver } from "./conflict-resolver"

export interface SimulationScenario {
  id: string
  name: string
  description: string
  baselineState: SimulationState
  modifications: ScenarioModification[]
  createdAt: Date
  duration: number // simulation duration in minutes
}

export interface SimulationState {
  trains: Train[]
  stations: Station[]
  tracks: Track[]
  conflicts: Conflict[]
  timestamp: Date
  kpis: KPI
}

export interface ScenarioModification {
  type: "delay_injection" | "train_hold" | "reroute" | "priority_change" | "signal_failure" | "track_blockage"
  targetId: string // train ID, station ID, or track ID
  parameters: Record<string, any>
  appliedAt: number // minutes from simulation start
  duration?: number // duration in minutes (for temporary modifications)
}

export interface SimulationResult {
  scenarioId: string
  finalState: SimulationState
  timeline: SimulationTimelineEvent[]
  kpiComparison: KPIComparison
  conflicts: Conflict[]
  recommendations: AIRecommendation[]
  success: boolean
  executionTime: number
}

export interface SimulationTimelineEvent {
  timestamp: Date
  type: "train_movement" | "conflict_detected" | "recommendation_applied" | "modification_applied"
  description: string
  affectedEntities: string[]
  impact: {
    delayChange: number
    conflictsCreated: number
    conflictsResolved: number
  }
}

export interface KPIComparison {
  baseline: KPI
  simulated: KPI
  improvements: {
    punctuality: number
    averageDelay: number
    throughput: number
    conflictsResolved: number
  }
}

export interface WhatIfAnalysis {
  question: string
  scenarios: SimulationScenario[]
  results: SimulationResult[]
  recommendation: string
  confidence: number
}

export class SimulationEngine {
  private optimizationEngine: TrainOptimizationEngine
  private conflictResolver: ConflictResolver
  private scenarios: Map<string, SimulationScenario>
  private results: Map<string, SimulationResult>

  constructor() {
    this.optimizationEngine = new TrainOptimizationEngine()
    this.conflictResolver = new ConflictResolver(this.optimizationEngine)
    this.scenarios = new Map()
    this.results = new Map()
  }

  /**
   * Create a new simulation scenario
   */
  createScenario(
    name: string,
    description: string,
    baselineState: SimulationState,
    modifications: ScenarioModification[] = [],
    duration = 120, // 2 hours default
  ): SimulationScenario {
    const scenario: SimulationScenario = {
      id: `scenario_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      description,
      baselineState: JSON.parse(JSON.stringify(baselineState)), // Deep clone
      modifications,
      createdAt: new Date(),
      duration,
    }

    this.scenarios.set(scenario.id, scenario)
    return scenario
  }

  /**
   * Run a simulation scenario and return detailed results
   */
  async runSimulation(scenarioId: string): Promise<SimulationResult> {
    const scenario = this.scenarios.get(scenarioId)
    if (!scenario) {
      throw new Error(`Scenario ${scenarioId} not found`)
    }

    const startTime = Date.now()
    const timeline: SimulationTimelineEvent[] = []
    const conflicts: Conflict[] = []
    const recommendations: AIRecommendation[] = []

    // Initialize simulation state
    const currentState = JSON.parse(JSON.stringify(scenario.baselineState)) as SimulationState
    const baselineKPIs = currentState.kpis

    // Track modifications to apply
    const pendingModifications = [...scenario.modifications].sort((a, b) => a.appliedAt - b.appliedAt)

    // Simulate time progression (1-minute intervals)
    for (let minute = 0; minute <= scenario.duration; minute++) {
      const currentTime = new Date(scenario.baselineState.timestamp.getTime() + minute * 60000)

      // Apply scheduled modifications
      const modificationsToApply = pendingModifications.filter((mod) => mod.appliedAt === minute)
      for (const modification of modificationsToApply) {
        const event = this.applyModification(currentState, modification, currentTime)
        timeline.push(event)
      }

      // Update train positions and detect conflicts
      this.updateTrainPositions(currentState, minute)
      const newConflicts = this.optimizationEngine.detectConflicts(
        currentState.trains,
        currentState.stations,
        currentState.tracks,
      )

      // Process new conflicts
      for (const conflict of newConflicts) {
        if (!conflicts.find((c) => c.id === conflict.id)) {
          conflicts.push(conflict)

          // Generate AI recommendations for new conflicts
          const conflictRecommendations = this.optimizationEngine.generateRecommendations(conflict, currentState.trains)
          recommendations.push(...conflictRecommendations)

          timeline.push({
            timestamp: currentTime,
            type: "conflict_detected",
            description: `${conflict.type} conflict detected at ${conflict.location}`,
            affectedEntities: conflict.trains,
            impact: {
              delayChange: conflict.estimatedDelay,
              conflictsCreated: 1,
              conflictsResolved: 0,
            },
          })
        }
      }

      // Auto-apply high-confidence AI recommendations
      const highConfidenceRecs = recommendations.filter((r) => r.confidence > 0.8)
      for (const rec of highConfidenceRecs) {
        this.applyRecommendation(currentState, rec, currentTime)
        timeline.push({
          timestamp: currentTime,
          type: "recommendation_applied",
          description: `Applied AI recommendation: ${rec.action}`,
          affectedEntities: [rec.targetTrain],
          impact: {
            delayChange: -rec.estimatedImpact.delayReduction,
            conflictsCreated: 0,
            conflictsResolved: 1,
          },
        })
      }

      // Update KPIs every 10 minutes
      if (minute % 10 === 0) {
        currentState.kpis = this.calculateCurrentKPIs(currentState)
      }
    }

    // Calculate final KPIs and comparison
    const finalKPIs = this.calculateCurrentKPIs(currentState)
    const kpiComparison: KPIComparison = {
      baseline: baselineKPIs,
      simulated: finalKPIs,
      improvements: {
        punctuality: finalKPIs.punctuality - baselineKPIs.punctuality,
        averageDelay: baselineKPIs.averageDelay - finalKPIs.averageDelay,
        throughput: finalKPIs.throughput - baselineKPIs.throughput,
        conflictsResolved: finalKPIs.conflictsResolved - baselineKPIs.conflictsResolved,
      },
    }

    const result: SimulationResult = {
      scenarioId,
      finalState: currentState,
      timeline,
      kpiComparison,
      conflicts,
      recommendations,
      success: conflicts.length === 0 || kpiComparison.improvements.punctuality > 0,
      executionTime: Date.now() - startTime,
    }

    this.results.set(scenarioId, result)
    return result
  }

  /**
   * Perform what-if analysis by comparing multiple scenarios
   */
  async performWhatIfAnalysis(
    question: string,
    baselineState: SimulationState,
    alternativeModifications: ScenarioModification[][],
  ): Promise<WhatIfAnalysis> {
    const scenarios: SimulationScenario[] = []
    const results: SimulationResult[] = []

    // Create baseline scenario
    const baselineScenario = this.createScenario("Baseline", "Current state without modifications", baselineState)
    scenarios.push(baselineScenario)

    // Create alternative scenarios
    alternativeModifications.forEach((modifications, index) => {
      const scenario = this.createScenario(
        `Alternative ${index + 1}`,
        `What-if scenario ${index + 1}`,
        baselineState,
        modifications,
      )
      scenarios.push(scenario)
    })

    // Run all simulations
    for (const scenario of scenarios) {
      const result = await this.runSimulation(scenario.id)
      results.push(result)
    }

    // Analyze results and generate recommendation
    const bestResult = results.reduce((best, current) => {
      const bestScore = this.calculateScenarioScore(best.kpiComparison)
      const currentScore = this.calculateScenarioScore(current.kpiComparison)
      return currentScore > bestScore ? current : best
    })

    const recommendation = this.generateWhatIfRecommendation(question, results, bestResult)
    const confidence = this.calculateRecommendationConfidence(results, bestResult)

    return {
      question,
      scenarios,
      results,
      recommendation,
      confidence,
    }
  }

  /**
   * Create predefined simulation scenarios for common situations
   */
  createPredefinedScenarios(baselineState: SimulationState): SimulationScenario[] {
    const scenarios: SimulationScenario[] = []

    // Scenario 1: Signal failure at major junction
    scenarios.push(
      this.createScenario("Signal Failure", "Signal failure at main junction for 30 minutes", baselineState, [
        {
          type: "signal_failure",
          targetId: "STN002", // Ghaziabad Junction
          parameters: { duration: 30, affectedSignals: ["GZB-S1", "GZB-S2"] },
          appliedAt: 15,
          duration: 30,
        },
      ]),
    )

    // Scenario 2: High-priority train delay
    scenarios.push(
      this.createScenario("Express Train Delay", "Major express train delayed by 20 minutes", baselineState, [
        {
          type: "delay_injection",
          targetId: "TRN001", // Shatabdi Express
          parameters: { delay: 20, reason: "Technical issue" },
          appliedAt: 10,
        },
      ]),
    )

    // Scenario 3: Track blockage
    scenarios.push(
      this.createScenario("Track Blockage", "Main track blocked for maintenance", baselineState, [
        {
          type: "track_blockage",
          targetId: "TRK001",
          parameters: { reason: "Emergency maintenance" },
          appliedAt: 20,
          duration: 45,
        },
      ]),
    )

    // Scenario 4: Multiple train delays (cascade effect)
    scenarios.push(
      this.createScenario("Cascade Delays", "Multiple trains delayed due to weather", baselineState, [
        {
          type: "delay_injection",
          targetId: "TRN001",
          parameters: { delay: 15, reason: "Weather" },
          appliedAt: 5,
        },
        {
          type: "delay_injection",
          targetId: "TRN002",
          parameters: { delay: 10, reason: "Weather" },
          appliedAt: 8,
        },
      ]),
    )

    return scenarios
  }

  /**
   * Compare two simulation results
   */
  compareScenarios(
    scenarioId1: string,
    scenarioId2: string,
  ): {
    scenario1: SimulationResult
    scenario2: SimulationResult
    comparison: {
      betterPunctuality: string
      lowerAverageDelay: string
      higherThroughput: string
      fewerConflicts: string
      overallBetter: string
      improvementPercentage: number
    }
  } {
    const result1 = this.results.get(scenarioId1)
    const result2 = this.results.get(scenarioId2)

    if (!result1 || !result2) {
      throw new Error("One or both scenarios not found")
    }

    const kpi1 = result1.kpiComparison.simulated
    const kpi2 = result2.kpiComparison.simulated

    const score1 = this.calculateScenarioScore(result1.kpiComparison)
    const score2 = this.calculateScenarioScore(result2.kpiComparison)

    return {
      scenario1: result1,
      scenario2: result2,
      comparison: {
        betterPunctuality: kpi1.punctuality > kpi2.punctuality ? scenarioId1 : scenarioId2,
        lowerAverageDelay: kpi1.averageDelay < kpi2.averageDelay ? scenarioId1 : scenarioId2,
        higherThroughput: kpi1.throughput > kpi2.throughput ? scenarioId1 : scenarioId2,
        fewerConflicts: result1.conflicts.length < result2.conflicts.length ? scenarioId1 : scenarioId2,
        overallBetter: score1 > score2 ? scenarioId1 : scenarioId2,
        improvementPercentage: Math.abs(((score1 - score2) / Math.max(score1, score2)) * 100),
      },
    }
  }

  // Private helper methods

  private applyModification(
    state: SimulationState,
    modification: ScenarioModification,
    timestamp: Date,
  ): SimulationTimelineEvent {
    const affectedEntities: string[] = []
    let description = ""
    let delayChange = 0

    switch (modification.type) {
      case "delay_injection":
        const train = state.trains.find((t) => t.id === modification.targetId)
        if (train) {
          const injectedDelay = modification.parameters.delay || 0
          train.delay += injectedDelay
          train.status = "delayed"
          delayChange = injectedDelay
          affectedEntities.push(train.id)
          description = `Injected ${injectedDelay}m delay to ${train.name} (${modification.parameters.reason || "Unknown reason"})`
        }
        break

      case "train_hold":
        const heldTrain = state.trains.find((t) => t.id === modification.targetId)
        if (heldTrain) {
          const holdDuration = modification.parameters.duration || 5
          heldTrain.delay += holdDuration
          heldTrain.status = "delayed"
          delayChange = holdDuration
          affectedEntities.push(heldTrain.id)
          description = `Held ${heldTrain.name} for ${holdDuration} minutes`
        }
        break

      case "priority_change":
        const priorityTrain = state.trains.find((t) => t.id === modification.targetId)
        if (priorityTrain) {
          const newPriority = modification.parameters.priority || priorityTrain.priority + 1
          priorityTrain.priority = Math.max(1, Math.min(10, newPriority))
          affectedEntities.push(priorityTrain.id)
          description = `Changed priority of ${priorityTrain.name} to ${priorityTrain.priority}`
        }
        break

      case "signal_failure":
        const station = state.stations.find((s) => s.id === modification.targetId)
        if (station) {
          // Simulate signal failure by adding delays to trains at this station
          const trainsAtStation = state.trains.filter((t) => t.currentStation === station.id)
          trainsAtStation.forEach((train) => {
            train.delay += 10 // 10 minute delay due to signal failure
            delayChange += 10
            affectedEntities.push(train.id)
          })
          description = `Signal failure at ${station.name} affecting ${trainsAtStation.length} trains`
        }
        break

      case "track_blockage":
        // Simulate track blockage by rerouting or delaying affected trains
        const affectedTrains = state.trains.filter((t) => t.nextStation === modification.targetId)
        affectedTrains.forEach((train) => {
          train.delay += 15 // 15 minute delay due to rerouting
          delayChange += 15
          affectedEntities.push(train.id)
        })
        description = `Track blockage affecting ${affectedTrains.length} trains`
        break
    }

    return {
      timestamp,
      type: "modification_applied",
      description,
      affectedEntities,
      impact: {
        delayChange,
        conflictsCreated: 0,
        conflictsResolved: 0,
      },
    }
  }

  private updateTrainPositions(state: SimulationState, minute: number): void {
    // Simplified train position update
    state.trains.forEach((train) => {
      if (train.speed > 0 && train.status !== "cancelled") {
        // Update coordinates based on speed (simplified)
        const speedFactor = train.speed / 60 // km per minute
        const direction = train.nextStation ? 1 : -1
        train.coordinates.lat += speedFactor * 0.001 * direction // Simplified coordinate update
      }
    })
  }

  private applyRecommendation(state: SimulationState, recommendation: AIRecommendation, timestamp: Date): void {
    const targetTrain = state.trains.find((t) => t.id === recommendation.targetTrain)
    if (!targetTrain) return

    switch (recommendation.type) {
      case "hold":
        targetTrain.delay += 5
        break
      case "proceed":
        targetTrain.delay = Math.max(0, targetTrain.delay - 2)
        break
      case "reroute":
        targetTrain.delay += 10
        break
      case "priority_change":
        targetTrain.priority = Math.max(1, targetTrain.priority - 1)
        break
    }
  }

  private calculateCurrentKPIs(state: SimulationState): KPI {
    return {
      punctuality: OptimizationUtils.calculateSystemEfficiency(state.trains),
      averageDelay: OptimizationUtils.calculateAverageDelay(state.trains),
      throughput: OptimizationUtils.calculateThroughput(state.trains),
      conflictsResolved: state.conflicts.filter((c) => c.severity === "low").length,
      aiAcceptanceRate: 85, // Simplified calculation
    }
  }

  private calculateScenarioScore(kpiComparison: KPIComparison): number {
    // Weighted scoring system
    const punctualityWeight = 0.4
    const delayWeight = 0.3
    const throughputWeight = 0.2
    const conflictWeight = 0.1

    return (
      kpiComparison.improvements.punctuality * punctualityWeight +
      kpiComparison.improvements.averageDelay * delayWeight +
      kpiComparison.improvements.throughput * throughputWeight +
      kpiComparison.improvements.conflictsResolved * conflictWeight
    )
  }

  private generateWhatIfRecommendation(
    question: string,
    results: SimulationResult[],
    bestResult: SimulationResult,
  ): string {
    const improvements = bestResult.kpiComparison.improvements
    let recommendation = `Based on the simulation analysis for "${question}", `

    if (improvements.punctuality > 5) {
      recommendation += `the recommended approach improves punctuality by ${improvements.punctuality.toFixed(1)}%. `
    }

    if (improvements.averageDelay > 2) {
      recommendation += `This reduces average delays by ${improvements.averageDelay.toFixed(1)} minutes. `
    }

    if (improvements.throughput > 1) {
      recommendation += `System throughput increases by ${improvements.throughput.toFixed(1)} trains per hour. `
    }

    recommendation += "This scenario provides the best overall system performance."

    return recommendation
  }

  private calculateRecommendationConfidence(results: SimulationResult[], bestResult: SimulationResult): number {
    const bestScore = this.calculateScenarioScore(bestResult.kpiComparison)
    const averageScore =
      results.reduce((sum, r) => sum + this.calculateScenarioScore(r.kpiComparison), 0) / results.length

    // Confidence based on how much better the best result is compared to average
    const improvement = (bestScore - averageScore) / Math.abs(averageScore)
    return Math.min(0.95, Math.max(0.5, 0.7 + improvement * 0.3))
  }

  // Public getters
  getScenario(id: string): SimulationScenario | undefined {
    return this.scenarios.get(id)
  }

  getResult(id: string): SimulationResult | undefined {
    return this.results.get(id)
  }

  getAllScenarios(): SimulationScenario[] {
    return Array.from(this.scenarios.values())
  }

  getAllResults(): SimulationResult[] {
    return Array.from(this.results.values())
  }
}

// Factory function
export function createSimulationEngine(): SimulationEngine {
  return new SimulationEngine()
}
