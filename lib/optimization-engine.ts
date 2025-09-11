// AI-powered optimization engine for train traffic management
// Implements conflict detection, resolution algorithms, and AI recommendations

import type { Train, Conflict, AIRecommendation, Station, Track } from "./types"

export interface OptimizationConstraints {
  maxDelay: number // Maximum acceptable delay in minutes
  priorityWeights: Record<string, number> // Weight factors for different train types
  safetyBuffer: number // Minimum time buffer between trains in minutes
  platformCapacity: Record<string, number> // Platform capacity per station
  reroutingDelay: number // Default delay for rerouting operations
  minTrainSpeed: number // Minimum train speed (must be > 0)
  singlePlatformDelay: number // Delay for single platform conflicts
  multiPlatformDelay: number // Delay for multi-platform conflicts
}

export interface ConflictResolutionOptions {
  allowRerouting: boolean
  allowPriorityOverride: boolean
  maxSimulationDepth: number
  optimizationObjective: "minimize_delay" | "maximize_throughput" | "balanced"
}

export class TrainOptimizationEngine {
  private constraints: OptimizationConstraints
  private options: ConflictResolutionOptions

  constructor(
    constraints: Partial<OptimizationConstraints> = {},
    options: ConflictResolutionOptions = {
      allowRerouting: true,
      allowPriorityOverride: false,
      maxSimulationDepth: 5,
      optimizationObjective: "balanced",
    },
  ) {
    this.constraints = {
      maxDelay: 30,
      priorityWeights: {
        express: 1.0,
        suburban: 0.8,
        freight: 0.4,
        special: 1.2,
        maintenance: 0.2,
      },
      safetyBuffer: 3,
      platformCapacity: {},
      reroutingDelay: 10,
      minTrainSpeed: 1,
      singlePlatformDelay: 8,
      multiPlatformDelay: 3,
      ...constraints,
    }
    this.options = options
  }

  /**
   * Detect potential conflicts between trains
   */
  detectConflicts(trains: Train[], stations: Station[], tracks: Track[]): Conflict[] {
    const conflicts: Conflict[] = []
    const activeTrains = trains.filter((t) => t.status !== "cancelled")

    // Group trains by station for efficient conflict detection
    const trainsByStation = new Map<string, Train[]>()
    activeTrains.forEach(train => {
      if (train.nextStation) {
        if (!trainsByStation.has(train.nextStation)) {
          trainsByStation.set(train.nextStation, [])
        }
        trainsByStation.get(train.nextStation)!.push(train)
      }
      if (train.currentStation) {
        if (!trainsByStation.has(train.currentStation)) {
          trainsByStation.set(train.currentStation, [])
        }
        trainsByStation.get(train.currentStation)!.push(train)
      }
    })

    // Check conflicts only between trains at same stations
    for (const [station, stationTrains] of trainsByStation) {
      for (let i = 0; i < stationTrains.length; i++) {
        for (let j = i + 1; j < stationTrains.length; j++) {
          const train1 = stationTrains[i]
          const train2 = stationTrains[j]

          const crossingConflict = this.checkCrossingConflict(train1, train2)
          if (crossingConflict) conflicts.push(crossingConflict)

          const platformConflict = this.checkPlatformConflict(train1, train2)
          if (platformConflict) conflicts.push(platformConflict)
        }
      }
    }

    // Check track conflicts separately
    for (let i = 0; i < activeTrains.length; i++) {
      for (let j = i + 1; j < activeTrains.length; j++) {
        const trackConflict = this.checkTrackConflict(activeTrains[i], activeTrains[j], tracks)
        if (trackConflict) conflicts.push(trackConflict)
      }
    }

    return conflicts
  }

  /**
   * Generate AI recommendations for resolving conflicts
   */
  generateRecommendations(conflict: Conflict, trains: Train[]): AIRecommendation[] {
    const recommendations: AIRecommendation[] = []
    const conflictTrains = trains.filter((t) => conflict.trains.includes(t.id))

    if (conflictTrains.length < 2) return recommendations

    // Sort trains by priority (higher priority first)
    const sortedTrains = [...conflictTrains].sort((a, b) => {
      const priorityA = a.priority * (this.constraints.priorityWeights[a.type] || 1.0)
      const priorityB = b.priority * (this.constraints.priorityWeights[b.type] || 1.0)
      return priorityB - priorityA
    })

    const highPriorityTrain = sortedTrains[0]
    const lowPriorityTrain = sortedTrains[1]

    // Recommendation 1: Hold lower priority train
    const holdRecommendation = this.generateHoldRecommendation(conflict, lowPriorityTrain, highPriorityTrain)
    recommendations.push(holdRecommendation)

    // Recommendation 2: Reroute if possible
    if (this.options.allowRerouting) {
      const rerouteRecommendation = this.generateRerouteRecommendation(conflict, lowPriorityTrain)
      if (rerouteRecommendation) {
        recommendations.push(rerouteRecommendation)
      }
    }

    // Recommendation 3: Priority override (if allowed)
    if (this.options.allowPriorityOverride && conflict.severity === "critical") {
      const priorityRecommendation = this.generatePriorityChangeRecommendation(
        conflict,
        highPriorityTrain,
        lowPriorityTrain,
      )
      recommendations.push(priorityRecommendation)
    }

    return recommendations.sort((a, b) => b.confidence - a.confidence)
  }

  /**
   * Simulate the impact of applying a recommendation
   */
  simulateRecommendation(
    recommendation: AIRecommendation,
    trains: Train[],
    stations: Station[],
  ): {
    totalDelayReduction: number
    affectedTrains: string[]
    newConflicts: Conflict[]
    feasible: boolean
  } {
    // Create a deep copy of trains for simulation
    const simulatedTrains = this.deepClone(trains)

    // Apply the recommendation
    const targetTrain = simulatedTrains.find((t) => t.id === recommendation.targetTrain)
    if (!targetTrain) {
      return {
        totalDelayReduction: 0,
        affectedTrains: [],
        newConflicts: [],
        feasible: false,
      }
    }

    let totalDelayReduction = 0
    const affectedTrains: string[] = [targetTrain.id]

    switch (recommendation.type) {
      case "hold":
        // Simulate holding the train
        const holdDelay = this.extractDelayFromAction(recommendation.action)
        targetTrain.delay += holdDelay
        totalDelayReduction = this.calculateDelayReduction(simulatedTrains, trains)
        break

      case "reroute":
        // Simulate rerouting (simplified)
        targetTrain.delay += this.constraints.reroutingDelay
        totalDelayReduction = recommendation.estimatedImpact.delayReduction
        break

      case "priority_change":
        // Simulate priority change
        targetTrain.priority = Math.max(1, targetTrain.priority - 1)
        break

      case "proceed":
        // No delay added, proceed as planned
        break
    }

    // Check for new conflicts after applying recommendation
    const newConflicts = this.detectConflicts(simulatedTrains, stations, [])

    return {
      totalDelayReduction,
      affectedTrains,
      newConflicts,
      feasible: totalDelayReduction > 0 && newConflicts.length === 0,
    }
  }

  /**
   * Optimize train schedule using constraint satisfaction
   */
  optimizeSchedule(
    trains: Train[],
    conflicts: Conflict[],
    stations: Station[] = [],
  ): {
    optimizedTrains: Train[]
    resolvedConflicts: string[]
    totalDelayReduction: number
  } {
    const optimizedTrains = this.deepClone(trains)
    const resolvedConflicts: string[] = []
    let totalDelayReduction = 0

    // Sort conflicts by severity and estimated delay
    const sortedConflicts = conflicts.sort((a, b) => {
      const severityWeight = { critical: 4, high: 3, medium: 2, low: 1 }
      return severityWeight[b.severity] * b.estimatedDelay - severityWeight[a.severity] * a.estimatedDelay
    })

    for (const conflict of sortedConflicts) {
      const recommendations = this.generateRecommendations(conflict, optimizedTrains)

      if (recommendations.length > 0) {
        const bestRecommendation = recommendations[0]
        const simulation = this.simulateRecommendation(bestRecommendation, optimizedTrains, stations)

        if (simulation.feasible) {
          // Apply the recommendation
          this.applyRecommendation(bestRecommendation, optimizedTrains)
          resolvedConflicts.push(conflict.id)
          totalDelayReduction += simulation.totalDelayReduction
        }
      }
    }

    return {
      optimizedTrains,
      resolvedConflicts,
      totalDelayReduction,
    }
  }

  // Private helper methods

  private deepClone<T>(obj: T): T {
    return structuredClone ? structuredClone(obj) : JSON.parse(JSON.stringify(obj)) as T
  }

  private generateUniqueId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private checkCrossingConflict(train1: Train, train2: Train): Conflict | null {
    // Simplified crossing conflict detection
    if (train1.nextStation === train2.nextStation) {
      const timeDiff = Math.abs(this.estimateArrivalTime(train1) - this.estimateArrivalTime(train2))

      if (timeDiff < this.constraints.safetyBuffer) {
        return {
          id: this.generateUniqueId(`crossing_${train1.id}_${train2.id}`),
          type: "crossing",
          trains: [train1.id, train2.id],
          location: train1.nextStation || "unknown",
          severity: timeDiff < 1 ? "critical" : "medium",
          estimatedDelay: Math.max(0, this.constraints.safetyBuffer - timeDiff),
        }
      }
    }
    return null
  }

  private checkPlatformConflict(train1: Train, train2: Train): Conflict | null {
    // Check if both trains need same platform at same time
    if (train1.currentStation === train2.currentStation) {
      const stationCapacity = this.constraints.platformCapacity[train1.currentStation || ""] || 1
      const estimatedDelay = stationCapacity > 1 ? this.constraints.multiPlatformDelay : this.constraints.singlePlatformDelay
      
      return {
        id: this.generateUniqueId(`platform_${train1.id}_${train2.id}`),
        type: "platform",
        trains: [train1.id, train2.id],
        location: train1.currentStation || "unknown",
        severity: "medium",
        estimatedDelay,
      }
    }
    return null
  }

  private checkTrackConflict(train1: Train, train2: Train, tracks: Track[]): Conflict | null {
    // Simplified track conflict detection
    const train1Track = this.findTrackBetweenStations(train1.currentStation, train1.nextStation, tracks)
    const train2Track = this.findTrackBetweenStations(train2.currentStation, train2.nextStation, tracks)

    if (train1Track && train2Track && train1Track.id === train2Track.id) {
      return {
        id: this.generateUniqueId(`track_${train1.id}_${train2.id}`),
        type: "track",
        trains: [train1.id, train2.id],
        location: train1Track.id,
        severity: "high",
        estimatedDelay: 8,
      }
    }
    return null
  }

  private generateHoldRecommendation(conflict: Conflict, targetTrain: Train, priorityTrain: Train): AIRecommendation {
    const holdTime = Math.max(3, conflict.estimatedDelay + this.constraints.safetyBuffer)

    return {
      id: this.generateUniqueId(`hold_${targetTrain.id}`),
      conflictId: conflict.id,
      type: "hold",
      targetTrain: targetTrain.id,
      action: `Hold ${targetTrain.name} (${targetTrain.number}) for ${holdTime} minutes`,
      reasoning: `Allow ${priorityTrain.name} to pass first. Priority: ${priorityTrain.priority} vs ${targetTrain.priority}`,
      confidence: 0.85,
      estimatedImpact: {
        delayReduction: conflict.estimatedDelay, // Preventing conflict saves the full estimated delay
        affectedTrains: [targetTrain.id, priorityTrain.id],
      },
      timestamp: new Date().toISOString(),
    }
  }

  private generateRerouteRecommendation(conflict: Conflict, targetTrain: Train): AIRecommendation | null {
    // Check if rerouting is feasible
    if (!targetTrain.nextStation || !targetTrain.currentStation) {
      return null // Missing station information
    }
    
    // Simplified feasibility check - in production, validate actual alternate routes
    const hasAlternateRoute = true // Assume alternate routes exist for demo
    
    return {
      id: this.generateUniqueId(`reroute_${targetTrain.id}`),
      conflictId: conflict.id,
      type: "reroute",
      targetTrain: targetTrain.id,
      action: `Reroute ${targetTrain.name} via alternate track`,
      reasoning: "Alternative route available with minimal delay impact",
      confidence: 0.72,
      estimatedImpact: {
        delayReduction: conflict.estimatedDelay * 0.6,
        affectedTrains: [targetTrain.id],
      },
      timestamp: new Date().toISOString(),
    }
  }

  private generatePriorityChangeRecommendation(
    conflict: Conflict,
    highPriorityTrain: Train,
    lowPriorityTrain: Train,
  ): AIRecommendation {
    return {
      id: this.generateUniqueId(`priority_${highPriorityTrain.id}`),
      conflictId: conflict.id,
      type: "priority_change",
      targetTrain: highPriorityTrain.id,
      action: `Temporarily reduce priority of ${highPriorityTrain.name}`,
      reasoning: "Critical situation requires priority adjustment to minimize system-wide delays",
      confidence: 0.65,
      estimatedImpact: {
        delayReduction: conflict.estimatedDelay * 0.4,
        affectedTrains: [highPriorityTrain.id, lowPriorityTrain.id],
      },
      timestamp: new Date().toISOString(),
    }
  }

  private estimateArrivalTime(train: Train): number {
    // Simplified arrival time estimation (in minutes from now)
    const baseTime = 30 // Assume 30 minutes to next station
    const safeSpeed = Math.max(train.speed, this.constraints.minTrainSpeed)
    const speedFactor = safeSpeed / 60 // Convert km/h to relative factor
    return baseTime / speedFactor + train.delay
  }

  private findTrackBetweenStations(from: string | undefined, to: string | undefined, tracks: Track[]): Track | null {
    if (!from || !to) return null
    return (
      tracks.find(
        (t) => (t.fromStation === from && t.toStation === to) || (t.fromStation === to && t.toStation === from),
      ) || null
    )
  }

  private extractDelayFromAction(action: string): number {
    const match = action.match(/(\d+)\s*minutes?/)
    return match ? Number.parseInt(match[1]) : 5
  }

  private calculateDelayReduction(newTrains: Train[], originalTrains: Train[]): number {
    const originalTotalDelay = originalTrains.reduce((sum, t) => sum + t.delay, 0)
    const newTotalDelay = newTrains.reduce((sum, t) => sum + t.delay, 0)
    return Math.max(0, originalTotalDelay - newTotalDelay)
  }

  private applyRecommendation(recommendation: AIRecommendation, trains: Train[]): void {
    const targetTrain = trains.find((t) => t.id === recommendation.targetTrain)
    if (!targetTrain) return

    switch (recommendation.type) {
      case "hold":
        const holdDelay = this.extractDelayFromAction(recommendation.action)
        targetTrain.delay += holdDelay
        break
      case "reroute":
        targetTrain.delay += this.constraints.reroutingDelay
        break
      case "priority_change":
        targetTrain.priority = Math.max(1, targetTrain.priority - 1)
        break
      default:
        console.warn("Unknown recommendation type:", String(recommendation.type))
        break
    }
  }
}

// Factory function to create optimization engine with default settings
export function createOptimizationEngine(): TrainOptimizationEngine {
  return new TrainOptimizationEngine()
}

// Utility functions for optimization calculations
export const OptimizationUtils = {
  calculateSystemEfficiency: (trains: Train[]): number => {
    const onTimeTrains = trains.filter((t) => t.delay <= 5).length
    return trains.length > 0 ? (onTimeTrains / trains.length) * 100 : 0
  },

  calculateAverageDelay: (trains: Train[]): number => {
    const totalDelay = trains.reduce((sum, t) => sum + t.delay, 0)
    return trains.length > 0 ? totalDelay / trains.length : 0
  },

  calculateThroughput: (trains: Train[], timeWindowHours = 1): number => {
    const activeTrains = trains.filter((t) => t.status !== "cancelled")
    return activeTrains.length / timeWindowHours
  },

  priorityScore: (train: Train, weights: Record<string, number>): number => {
    if (!train.type) {
      return train.priority * 1.0
    }
    return train.priority * (weights[train.type] || 1.0)
  },
}
