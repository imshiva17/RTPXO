import { Train, Conflict, AIRecommendation } from '../types'

export class AIOptimizer {
  private readonly PRIORITY_WEIGHTS = {
    express: 0.9,
    freight: 0.4,
    suburban: 0.7,
    special: 0.8,
    maintenance: 0.2
  }

  generateRecommendations(conflicts: Conflict[], trains: Train[]): AIRecommendation[] {
    return conflicts.map(conflict => this.createRecommendation(conflict, trains))
  }

  private createRecommendation(conflict: Conflict, trains: Train[]): AIRecommendation {
    const involvedTrains = conflict.trains.map(id => trains.find(t => t.id === id)!).filter(Boolean)
    const action = this.determineOptimalAction(conflict, involvedTrains)
    
    return {
      id: `rec_${conflict.id}`,
      conflictId: conflict.id,
      type: action.type,
      targetTrain: action.targetTrain,
      action: action.description,
      reasoning: action.reasoning,
      confidence: this.calculateConfidence(conflict, involvedTrains),
      estimatedImpact: this.estimateImpact(conflict, involvedTrains, action),
      timestamp: new Date().toISOString()
    }
  }

  private determineOptimalAction(conflict: Conflict, trains: Train[]) {
    const priorityScores = trains.map(train => ({
      train,
      score: this.calculatePriorityScore(train)
    })).sort((a, b) => b.score - a.score)

    const highestPriority = priorityScores[0]
    const lowestPriority = priorityScores[priorityScores.length - 1]

    if (conflict.severity === 'critical') {
      return {
        type: 'hold' as const,
        targetTrain: lowestPriority.train.id,
        description: `Hold ${lowestPriority.train.name} to allow ${highestPriority.train.name} to proceed`,
        reasoning: `Critical conflict requires immediate action. ${highestPriority.train.name} has higher priority.`
      }
    }

    return {
      type: 'proceed' as const,
      targetTrain: highestPriority.train.id,
      description: `Allow ${highestPriority.train.name} to proceed with reduced speed`,
      reasoning: `Manageable conflict. Speed reduction minimizes delay while maintaining safety.`
    }
  }

  private calculatePriorityScore(train: Train): number {
    const typeWeight = this.PRIORITY_WEIGHTS[train.type] || 0.5
    const delayPenalty = Math.max(0, 1 - (train.delay / 60)) // Reduce score for delayed trains
    const basePriority = train.priority / 10
    
    return (typeWeight * 0.4 + delayPenalty * 0.3 + basePriority * 0.3) * 100
  }

  private calculateConfidence(conflict: Conflict, trains: Train[]): number {
    let confidence = 0.8 // Base confidence
    
    // Reduce confidence for complex scenarios
    if (trains.length > 2) confidence -= 0.1
    if (conflict.severity === 'critical') confidence += 0.1
    
    // Factor in data quality
    const hasCompleteData = trains.every(t => t.currentStation && t.speed > 0)
    if (!hasCompleteData) confidence -= 0.2
    
    return Math.max(0.3, Math.min(0.95, confidence))
  }

  private estimateImpact(conflict: Conflict, trains: Train[], action: any) {
    const baseDelayReduction = conflict.estimatedDelay * 0.6
    const affectedTrains = action.type === 'hold' ? [action.targetTrain] : conflict.trains
    
    return {
      delayReduction: Math.floor(baseDelayReduction),
      affectedTrains
    }
  }

  optimizeRoutes(trains: Train[]): { trainId: string, suggestedRoute: string[] }[] {
    return trains.map(train => ({
      trainId: train.id,
      suggestedRoute: this.calculateOptimalRoute(train)
    }))
  }

  private calculateOptimalRoute(train: Train): string[] {
    // Simplified route optimization
    return [train.currentStation || 'unknown', train.nextStation || 'unknown']
  }
}