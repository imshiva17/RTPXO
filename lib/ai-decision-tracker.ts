// AI Decision Tracker for storing and analyzing recommendation outcomes
export interface AIDecision {
  id: string
  timestamp: Date
  conflictId: string
  recommendationType: string
  recommendation: string
  reasoning: string
  confidence: number
  userAction: 'accepted' | 'rejected'
  outcome?: {
    delayReduction: number
    conflictResolved: boolean
    additionalIssues: string[]
  }
  contextData: {
    trainIds: string[]
    location: string
    severity: string
    timeOfDay: string
    weatherConditions?: string
  }
}

class AIDecisionTracker {
  private decisions: AIDecision[] = []

  logDecision(decision: AIDecision) {
    this.decisions.push(decision)
    this.saveToStorage()
  }

  getDecisionHistory(): AIDecision[] {
    return this.decisions
  }

  getAcceptanceRate(): number {
    if (this.decisions.length === 0) return 0
    const accepted = this.decisions.filter(d => d.userAction === 'accepted').length
    return (accepted / this.decisions.length) * 100
  }

  getSuccessRate(): number {
    const acceptedDecisions = this.decisions.filter(d => d.userAction === 'accepted' && d.outcome)
    if (acceptedDecisions.length === 0) return 0
    const successful = acceptedDecisions.filter(d => d.outcome!.conflictResolved).length
    return (successful / acceptedDecisions.length) * 100
  }

  private saveToStorage() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ai-decisions', JSON.stringify(this.decisions))
    }
  }

  loadFromStorage() {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('ai-decisions')
      if (stored) {
        this.decisions = JSON.parse(stored).map((d: any) => ({
          ...d,
          timestamp: new Date(d.timestamp)
        }))
      }
    }
  }
}

export const aiDecisionTracker = new AIDecisionTracker()