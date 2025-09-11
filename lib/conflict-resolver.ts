// Advanced conflict resolution algorithms and decision support system

import type { Conflict, Train, AIRecommendation, Station } from "./types"
import type { TrainOptimizationEngine } from "./optimization-engine"

export interface ResolutionStrategy {
  name: string
  description: string
  applicableConflictTypes: string[]
  execute: (conflict: Conflict, trains: Train[]) => AIRecommendation[]
}

export class ConflictResolver {
  private optimizationEngine: TrainOptimizationEngine
  private strategies: Map<string, ResolutionStrategy>

  constructor(optimizationEngine: TrainOptimizationEngine) {
    this.optimizationEngine = optimizationEngine
    this.strategies = new Map()
    this.initializeStrategies()
  }

  /**
   * Resolve conflicts using multiple strategies and select the best approach
   */
  resolveConflict(
    conflict: Conflict,
    trains: Train[],
    stations: Station[],
  ): {
    primaryRecommendation: AIRecommendation
    alternativeRecommendations: AIRecommendation[]
    confidence: number
    reasoning: string
  } {
    const applicableStrategies = Array.from(this.strategies.values()).filter((strategy) =>
      strategy.applicableConflictTypes.includes(conflict.type),
    )

    const allRecommendations: AIRecommendation[] = []

    // Generate recommendations using all applicable strategies
    for (const strategy of applicableStrategies) {
      const recommendations = strategy.execute(conflict, trains)
      allRecommendations.push(...recommendations)
    }

    // Simulate and score each recommendation
    const scoredRecommendations = allRecommendations.map((rec) => {
      const simulation = this.optimizationEngine.simulateRecommendation(rec, trains, stations)
      const score = this.calculateRecommendationScore(rec, simulation, conflict)

      return {
        recommendation: rec,
        simulation,
        score,
      }
    })

    // Sort by score (highest first)
    scoredRecommendations.sort((a, b) => b.score - a.score)

    const best = scoredRecommendations[0]
    const alternatives = scoredRecommendations.slice(1, 3).map((item) => item.recommendation)

    return {
      primaryRecommendation: best.recommendation,
      alternativeRecommendations: alternatives,
      confidence: best.score,
      reasoning: this.generateReasoningExplanation(best, conflict),
    }
  }

  /**
   * Batch resolve multiple conflicts with system-wide optimization
   */
  resolveMultipleConflicts(
    conflicts: Conflict[],
    trains: Train[],
    stations: Station[],
  ): {
    resolutions: Array<{
      conflictId: string
      recommendation: AIRecommendation
      priority: number
    }>
    systemImpact: {
      totalDelayReduction: number
      affectedTrains: string[]
      newConflictsCreated: number
    }
  } {
    // Sort conflicts by priority (severity + estimated delay)
    const prioritizedConflicts = conflicts.sort((a, b) => {
      const priorityA = this.calculateConflictPriority(a)
      const priorityB = this.calculateConflictPriority(b)
      return priorityB - priorityA
    })

    const resolutions: Array<{
      conflictId: string
      recommendation: AIRecommendation
      priority: number
    }> = []

    const workingTrains = JSON.parse(JSON.stringify(trains)) as Train[]
    let totalDelayReduction = 0
    const affectedTrains = new Set<string>()
    let newConflictsCreated = 0

    // Resolve conflicts in priority order
    for (const conflict of prioritizedConflicts) {
      const resolution = this.resolveConflict(conflict, workingTrains, stations)

      if (resolution.confidence > 0.5) {
        // Only apply high-confidence recommendations
        // Apply the recommendation to working trains
        this.applyRecommendationToTrains(resolution.primaryRecommendation, workingTrains)

        resolutions.push({
          conflictId: conflict.id,
          recommendation: resolution.primaryRecommendation,
          priority: this.calculateConflictPriority(conflict),
        })

        // Track system impact
        totalDelayReduction += resolution.primaryRecommendation.estimatedImpact.delayReduction
        resolution.primaryRecommendation.estimatedImpact.affectedTrains.forEach((trainId) =>
          affectedTrains.add(trainId),
        )

        // Check for new conflicts created by this resolution
        const newConflicts = this.optimizationEngine.detectConflicts(workingTrains, stations, [])
        const originalConflictIds = new Set(conflicts.map((c) => c.id))
        newConflictsCreated += newConflicts.filter((c) => !originalConflictIds.has(c.id)).length
      }
    }

    return {
      resolutions,
      systemImpact: {
        totalDelayReduction,
        affectedTrains: Array.from(affectedTrains),
        newConflictsCreated,
      },
    }
  }

  private initializeStrategies(): void {
    // Strategy 1: First-Come-First-Served
    this.strategies.set("fcfs", {
      name: "First-Come-First-Served",
      description: "Prioritize trains based on arrival order",
      applicableConflictTypes: ["crossing", "platform"],
      execute: (conflict: Conflict, trains: Train[]): AIRecommendation[] => {
        const conflictTrains = trains.filter((t) => conflict.trains.includes(t.id))
        if (conflictTrains.length < 2) return []

        // Sort by estimated arrival time
        const sortedTrains = conflictTrains.sort((a, b) => this.estimateArrivalTime(a) - this.estimateArrivalTime(b))

        const firstTrain = sortedTrains[0]
        const secondTrain = sortedTrains[1]

        return [
          {
            id: `fcfs_${conflict.id}_${Date.now()}`,
            conflictId: conflict.id,
            type: "hold",
            targetTrain: secondTrain.id,
            action: `Hold ${secondTrain.name} until ${firstTrain.name} clears`,
            reasoning: "First-come-first-served principle applied",
            confidence: 0.7,
            estimatedImpact: {
              delayReduction: conflict.estimatedDelay * 0.5,
              affectedTrains: [firstTrain.id, secondTrain.id],
            },
            timestamp: new Date().toISOString(),
          },
        ]
      },
    })

    // Strategy 2: Priority-Based Resolution
    this.strategies.set("priority", {
      name: "Priority-Based Resolution",
      description: "Prioritize trains based on type and importance",
      applicableConflictTypes: ["crossing", "platform", "track"],
      execute: (conflict: Conflict, trains: Train[]): AIRecommendation[] => {
        const conflictTrains = trains.filter((t) => conflict.trains.includes(t.id))
        if (conflictTrains.length < 2) return []

        // Sort by priority (higher first)
        const sortedTrains = conflictTrains.sort((a, b) => b.priority - a.priority)
        const highPriorityTrain = sortedTrains[0]
        const lowPriorityTrain = sortedTrains[1]

        return [
          {
            id: `priority_${conflict.id}_${Date.now()}`,
            conflictId: conflict.id,
            type: "hold",
            targetTrain: lowPriorityTrain.id,
            action: `Hold ${lowPriorityTrain.name} to allow ${highPriorityTrain.name} to proceed`,
            reasoning: `Priority-based resolution: ${highPriorityTrain.type} (${highPriorityTrain.priority}) > ${lowPriorityTrain.type} (${lowPriorityTrain.priority})`,
            confidence: 0.85,
            estimatedImpact: {
              delayReduction: conflict.estimatedDelay * 0.7,
              affectedTrains: [highPriorityTrain.id, lowPriorityTrain.id],
            },
            timestamp: new Date().toISOString(),
          },
        ]
      },
    })

    // Strategy 3: Minimum Delay Strategy
    this.strategies.set("min_delay", {
      name: "Minimum System Delay",
      description: "Minimize total system delay across all affected trains",
      applicableConflictTypes: ["crossing", "platform", "track", "signal"],
      execute: (conflict: Conflict, trains: Train[]): AIRecommendation[] => {
        const conflictTrains = trains.filter((t) => conflict.trains.includes(t.id))
        if (conflictTrains.length < 2) return []

        // Calculate delay impact for each possible resolution
        const recommendations: AIRecommendation[] = []

        for (let i = 0; i < conflictTrains.length; i++) {
          const trainToHold = conflictTrains[i]
          const otherTrains = conflictTrains.filter((_, index) => index !== i)

          const estimatedDelay = this.calculateMinimumDelayImpact(trainToHold, otherTrains, conflict)

          recommendations.push({
            id: `min_delay_${trainToHold.id}_${Date.now()}`,
            conflictId: conflict.id,
            type: "hold",
            targetTrain: trainToHold.id,
            action: `Hold ${trainToHold.name} for optimal system delay`,
            reasoning: `Holding this train minimizes total system delay by ${estimatedDelay.reduction} minutes`,
            confidence: 0.8,
            estimatedImpact: {
              delayReduction: estimatedDelay.reduction,
              affectedTrains: conflict.trains,
            },
            timestamp: new Date().toISOString(),
          })
        }

        return recommendations.sort((a, b) => b.estimatedImpact.delayReduction - a.estimatedImpact.delayReduction)
      },
    })
  }

  private calculateRecommendationScore(recommendation: AIRecommendation, simulation: any, conflict: Conflict): number {
    let score = 0

    // Base confidence score
    score += recommendation.confidence * 40

    // Delay reduction benefit
    score += Math.min(simulation.totalDelayReduction * 2, 30)

    // Feasibility bonus
    if (simulation.feasible) score += 20

    // Penalty for creating new conflicts
    score -= simulation.newConflicts.length * 5

    // Severity-based urgency bonus
    const severityBonus = { critical: 15, high: 10, medium: 5, low: 0 }
    score += severityBonus[conflict.severity] || 0

    return Math.max(0, Math.min(100, score))
  }

  private generateReasoningExplanation(scoredRecommendation: any, conflict: Conflict): string {
    const rec = scoredRecommendation.recommendation
    const sim = scoredRecommendation.simulation

    let explanation = `${rec.reasoning}. `

    if (sim.totalDelayReduction > 0) {
      explanation += `This action will reduce total system delay by ${sim.totalDelayReduction} minutes. `
    }

    if (sim.newConflicts.length > 0) {
      explanation += `Note: This may create ${sim.newConflicts.length} new minor conflicts. `
    }

    explanation += `Confidence: ${Math.round(scoredRecommendation.score)}%`

    return explanation
  }

  private calculateConflictPriority(conflict: Conflict): number {
    const severityWeight = { critical: 10, high: 7, medium: 4, low: 1 }
    return (severityWeight[conflict.severity] || 1) * conflict.estimatedDelay
  }

  private estimateArrivalTime(train: Train): number {
    // Simplified arrival time estimation
    return 30 + train.delay - train.speed / 10
  }

  private calculateMinimumDelayImpact(
    trainToHold: Train,
    otherTrains: Train[],
    conflict: Conflict,
  ): { reduction: number; totalImpact: number } {
    // Simplified calculation - in real implementation, this would be more sophisticated
    const holdPenalty = trainToHold.priority * 2
    const benefitToOthers = otherTrains.reduce((sum, t) => sum + t.priority, 0)

    return {
      reduction: Math.max(0, benefitToOthers - holdPenalty),
      totalImpact: conflict.estimatedDelay,
    }
  }

  private applyRecommendationToTrains(recommendation: AIRecommendation, trains: Train[]): void {
    const targetTrain = trains.find((t) => t.id === recommendation.targetTrain)
    if (!targetTrain) return

    switch (recommendation.type) {
      case "hold":
        targetTrain.delay += 5 // Simplified delay application
        break
      case "reroute":
        targetTrain.delay += 10
        break
      case "priority_change":
        targetTrain.priority = Math.max(1, targetTrain.priority - 1)
        break
    }
  }
}
