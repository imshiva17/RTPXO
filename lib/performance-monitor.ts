// Advanced performance monitoring and KPI tracking system

import type { Train, Conflict, AIRecommendation } from "./types"

export interface PerformanceMetrics {
  timestamp: Date
  punctuality: number
  averageDelay: number
  throughput: number
  conflictsResolved: number
  aiAcceptanceRate: number
  systemEfficiency: number
  resourceUtilization: number
  customerSatisfaction: number
}

export interface PerformanceAlert {
  id: string
  type: "warning" | "critical" | "info"
  metric: string
  threshold: number
  currentValue: number
  message: string
  timestamp: Date
  acknowledged: boolean
}

export interface PerformanceTrend {
  metric: string
  direction: "up" | "down" | "stable"
  changePercentage: number
  timeframe: "1h" | "24h" | "7d" | "30d"
}

export interface PerformanceReport {
  id: string
  title: string
  period: { start: Date; end: Date }
  summary: {
    totalTrains: number
    onTimePercentage: number
    averageDelay: number
    conflictsHandled: number
    aiRecommendationsAccepted: number
  }
  trends: PerformanceTrend[]
  alerts: PerformanceAlert[]
  recommendations: string[]
  generatedAt: Date
}

export interface KPITarget {
  metric: string
  target: number
  warning: number
  critical: number
  unit: string
}

export class PerformanceMonitor {
  private metrics: PerformanceMetrics[]
  private alerts: PerformanceAlert[]
  private targets: Map<string, KPITarget>
  private reports: PerformanceReport[]

  constructor() {
    this.metrics = []
    this.alerts = []
    this.targets = new Map()
    this.reports = []
    this.initializeTargets()
  }

  /**
   * Record current performance metrics
   */
  recordMetrics(trains: Train[], conflicts: Conflict[], recommendations: AIRecommendation[]): PerformanceMetrics {
    const timestamp = new Date()

    const onTimeTrains = trains.filter((t) => t.delay <= 5).length
    const punctuality = trains.length > 0 ? (onTimeTrains / trains.length) * 100 : 0

    const totalDelay = trains.reduce((sum, t) => sum + t.delay, 0)
    const averageDelay = trains.length > 0 ? totalDelay / trains.length : 0

    const throughput = this.calculateThroughput(trains)
    const conflictsResolved = conflicts.filter((c) => c.severity === "low").length
    const aiAcceptanceRate = this.calculateAIAcceptanceRate(recommendations)
    const systemEfficiency = this.calculateSystemEfficiency(trains, conflicts)
    const resourceUtilization = this.calculateResourceUtilization(trains)
    const customerSatisfaction = this.calculateCustomerSatisfaction(punctuality, averageDelay)

    const metrics: PerformanceMetrics = {
      timestamp,
      punctuality,
      averageDelay,
      throughput,
      conflictsResolved,
      aiAcceptanceRate,
      systemEfficiency,
      resourceUtilization,
      customerSatisfaction,
    }

    this.metrics.push(metrics)

    // Keep only last 24 hours of metrics
    const cutoff = new Date(timestamp.getTime() - 24 * 60 * 60 * 1000)
    this.metrics = this.metrics.filter((m) => m.timestamp > cutoff)

    // Check for alerts
    this.checkAlerts(metrics)

    return metrics
  }

  /**
   * Get performance trends for specified timeframe
   */
  getTrends(timeframe: "1h" | "24h" | "7d" | "30d"): PerformanceTrend[] {
    const now = new Date()
    const timeframes = {
      "1h": 60 * 60 * 1000,
      "24h": 24 * 60 * 60 * 1000,
      "7d": 7 * 24 * 60 * 60 * 1000,
      "30d": 30 * 24 * 60 * 60 * 1000,
    }

    const cutoff = new Date(now.getTime() - timeframes[timeframe])
    const relevantMetrics = this.metrics.filter((m) => m.timestamp > cutoff)

    if (relevantMetrics.length < 2) {
      return []
    }

    const latest = relevantMetrics[relevantMetrics.length - 1]
    const earliest = relevantMetrics[0]

    const trends: PerformanceTrend[] = [
      {
        metric: "punctuality",
        direction: this.getTrendDirection(earliest.punctuality, latest.punctuality),
        changePercentage: this.getChangePercentage(earliest.punctuality, latest.punctuality),
        timeframe,
      },
      {
        metric: "averageDelay",
        direction: this.getTrendDirection(earliest.averageDelay, latest.averageDelay, true), // Inverted for delay
        changePercentage: this.getChangePercentage(earliest.averageDelay, latest.averageDelay),
        timeframe,
      },
      {
        metric: "throughput",
        direction: this.getTrendDirection(earliest.throughput, latest.throughput),
        changePercentage: this.getChangePercentage(earliest.throughput, latest.throughput),
        timeframe,
      },
      {
        metric: "systemEfficiency",
        direction: this.getTrendDirection(earliest.systemEfficiency, latest.systemEfficiency),
        changePercentage: this.getChangePercentage(earliest.systemEfficiency, latest.systemEfficiency),
        timeframe,
      },
    ]

    return trends
  }

  /**
   * Generate comprehensive performance report
   */
  generateReport(startDate: Date, endDate: Date): PerformanceReport {
    const relevantMetrics = this.metrics.filter((m) => m.timestamp >= startDate && m.timestamp <= endDate)

    if (relevantMetrics.length === 0) {
      throw new Error("No metrics available for the specified period")
    }

    const totalTrains = relevantMetrics.reduce((sum, m) => sum + m.throughput, 0)
    const avgPunctuality = relevantMetrics.reduce((sum, m) => sum + m.punctuality, 0) / relevantMetrics.length
    const avgDelay = relevantMetrics.reduce((sum, m) => sum + m.averageDelay, 0) / relevantMetrics.length
    const totalConflicts = relevantMetrics.reduce((sum, m) => sum + m.conflictsResolved, 0)
    const avgAIAcceptance = relevantMetrics.reduce((sum, m) => sum + m.aiAcceptanceRate, 0) / relevantMetrics.length

    const trends = this.getTrends("24h")
    const periodAlerts = this.alerts.filter((a) => a.timestamp >= startDate && a.timestamp <= endDate)

    const recommendations = this.generateRecommendations(relevantMetrics, trends, periodAlerts)

    const report: PerformanceReport = {
      id: `report_${Date.now()}`,
      title: `Performance Report - ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`,
      period: { start: startDate, end: endDate },
      summary: {
        totalTrains: Math.round(totalTrains),
        onTimePercentage: Math.round(avgPunctuality * 100) / 100,
        averageDelay: Math.round(avgDelay * 100) / 100,
        conflictsHandled: totalConflicts,
        aiRecommendationsAccepted: Math.round(avgAIAcceptance),
      },
      trends,
      alerts: periodAlerts,
      recommendations,
      generatedAt: new Date(),
    }

    this.reports.push(report)
    return report
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): PerformanceAlert[] {
    return this.alerts.filter((a) => !a.acknowledged)
  }

  /**
   * Acknowledge an alert
   */
  acknowledgeAlert(alertId: string): void {
    const alert = this.alerts.find((a) => a.id === alertId)
    if (alert) {
      alert.acknowledged = true
    }
  }

  /**
   * Get historical metrics for charting
   */
  getHistoricalMetrics(hours = 24): PerformanceMetrics[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000)
    return this.metrics.filter((m) => m.timestamp > cutoff)
  }

  /**
   * Calculate system health score (0-100)
   */
  getSystemHealthScore(): number {
    if (this.metrics.length === 0) return 0

    const latest = this.metrics[this.metrics.length - 1]
    const weights = {
      punctuality: 0.3,
      efficiency: 0.25,
      throughput: 0.2,
      satisfaction: 0.15,
      utilization: 0.1,
    }

    const normalizedScores = {
      punctuality: Math.min(100, latest.punctuality),
      efficiency: Math.min(100, latest.systemEfficiency),
      throughput: Math.min(100, (latest.throughput / 30) * 100), // Normalize to 30 trains/hour max
      satisfaction: Math.min(100, latest.customerSatisfaction),
      utilization: Math.min(100, latest.resourceUtilization),
    }

    const healthScore = Object.entries(weights).reduce((score, [metric, weight]) => {
      return score + normalizedScores[metric as keyof typeof normalizedScores] * weight
    }, 0)

    return Math.round(healthScore)
  }

  // Private helper methods

  private initializeTargets(): void {
    this.targets.set("punctuality", {
      metric: "punctuality",
      target: 85,
      warning: 75,
      critical: 65,
      unit: "%",
    })

    this.targets.set("averageDelay", {
      metric: "averageDelay",
      target: 5,
      warning: 10,
      critical: 15,
      unit: "min",
    })

    this.targets.set("throughput", {
      metric: "throughput",
      target: 25,
      warning: 20,
      critical: 15,
      unit: "trains/h",
    })

    this.targets.set("systemEfficiency", {
      metric: "systemEfficiency",
      target: 90,
      warning: 80,
      critical: 70,
      unit: "%",
    })
  }

  private calculateThroughput(trains: Train[]): number {
    // Simplified throughput calculation
    const activeTrains = trains.filter((t) => t.status !== "cancelled")
    return activeTrains.length * 2.5 // Approximate trains per hour
  }

  private calculateAIAcceptanceRate(recommendations: AIRecommendation[]): number {
    if (recommendations.length === 0) return 0
    // Simplified calculation - in real system, track actual acceptance
    return 82 + Math.random() * 10 // Mock data between 82-92%
  }

  private calculateSystemEfficiency(trains: Train[], conflicts: Conflict[]): number {
    const onTimeTrains = trains.filter((t) => t.delay <= 5).length
    const baseEfficiency = trains.length > 0 ? (onTimeTrains / trains.length) * 100 : 0

    // Reduce efficiency based on active conflicts
    const conflictPenalty = conflicts.length * 5
    return Math.max(0, baseEfficiency - conflictPenalty)
  }

  private calculateResourceUtilization(trains: Train[]): number {
    // Simplified resource utilization based on train distribution
    const expressTrains = trains.filter((t) => t.type === "express").length
    const freightTrains = trains.filter((t) => t.type === "freight").length
    const totalCapacity = 20 // Assume section capacity of 20 trains

    return Math.min(100, (trains.length / totalCapacity) * 100)
  }

  private calculateCustomerSatisfaction(punctuality: number, averageDelay: number): number {
    // Customer satisfaction based on punctuality and delays
    let satisfaction = punctuality

    // Penalty for delays
    if (averageDelay > 10) satisfaction -= 20
    else if (averageDelay > 5) satisfaction -= 10

    return Math.max(0, Math.min(100, satisfaction))
  }

  private checkAlerts(metrics: PerformanceMetrics): void {
    const timestamp = new Date()

    // Check each metric against targets
    for (const [metricName, target] of this.targets) {
      const value = metrics[metricName as keyof PerformanceMetrics] as number

      let alertType: "warning" | "critical" | null = null
      let message = ""

      if (metricName === "averageDelay") {
        // For delay, higher values are worse
        if (value >= target.critical) {
          alertType = "critical"
          message = `Average delay critically high: ${value.toFixed(1)}${target.unit} (target: <${target.target}${target.unit})`
        } else if (value >= target.warning) {
          alertType = "warning"
          message = `Average delay above warning threshold: ${value.toFixed(1)}${target.unit}`
        }
      } else {
        // For other metrics, lower values are worse
        if (value <= target.critical) {
          alertType = "critical"
          message = `${metricName} critically low: ${value.toFixed(1)}${target.unit} (target: >${target.target}${target.unit})`
        } else if (value <= target.warning) {
          alertType = "warning"
          message = `${metricName} below warning threshold: ${value.toFixed(1)}${target.unit}`
        }
      }

      if (alertType) {
        // Check if similar alert already exists in last 10 minutes
        const recentAlerts = this.alerts.filter(
          (a) => a.metric === metricName && a.timestamp > new Date(timestamp.getTime() - 10 * 60 * 1000),
        )

        if (recentAlerts.length === 0) {
          const alert: PerformanceAlert = {
            id: `alert_${timestamp.getTime()}_${metricName}`,
            type: alertType,
            metric: metricName,
            threshold: alertType === "critical" ? target.critical : target.warning,
            currentValue: value,
            message,
            timestamp,
            acknowledged: false,
          }

          this.alerts.push(alert)
        }
      }
    }

    // Clean up old alerts (older than 24 hours)
    const cutoff = new Date(timestamp.getTime() - 24 * 60 * 60 * 1000)
    this.alerts = this.alerts.filter((a) => a.timestamp > cutoff)
  }

  private getTrendDirection(oldValue: number, newValue: number, inverted = false): "up" | "down" | "stable" {
    const threshold = 0.05 // 5% change threshold
    const change = (newValue - oldValue) / oldValue

    if (Math.abs(change) < threshold) return "stable"

    if (inverted) {
      return change > 0 ? "down" : "up" // For metrics where lower is better (like delay)
    }

    return change > 0 ? "up" : "down"
  }

  private getChangePercentage(oldValue: number, newValue: number): number {
    if (oldValue === 0) return 0
    return Math.round(((newValue - oldValue) / oldValue) * 100 * 100) / 100
  }

  private generateRecommendations(
    metrics: PerformanceMetrics[],
    trends: PerformanceTrend[],
    alerts: PerformanceAlert[],
  ): string[] {
    const recommendations: string[] = []

    // Analyze trends for recommendations
    const punctualityTrend = trends.find((t) => t.metric === "punctuality")
    if (punctualityTrend?.direction === "down") {
      recommendations.push("Consider increasing AI recommendation acceptance rate to improve punctuality")
    }

    const delayTrend = trends.find((t) => t.metric === "averageDelay")
    if (delayTrend?.direction === "down") {
      // Remember: down is bad for delay (means increasing)
      recommendations.push("Implement proactive conflict detection to reduce average delays")
    }

    // Analyze alerts for recommendations
    const criticalAlerts = alerts.filter((a) => a.type === "critical")
    if (criticalAlerts.length > 0) {
      recommendations.push("Address critical performance alerts immediately to prevent system degradation")
    }

    // General recommendations based on latest metrics
    if (metrics.length > 0) {
      const latest = metrics[metrics.length - 1]

      if (latest.aiAcceptanceRate < 70) {
        recommendations.push("Increase controller training on AI recommendations to improve acceptance rate")
      }

      if (latest.systemEfficiency < 80) {
        recommendations.push("Review resource allocation and consider capacity optimization")
      }
    }

    return recommendations
  }

  // Public getters
  getTargets(): KPITarget[] {
    return Array.from(this.targets.values())
  }

  getReports(): PerformanceReport[] {
    return this.reports
  }
}

// Factory function
export function createPerformanceMonitor(): PerformanceMonitor {
  return new PerformanceMonitor()
}
