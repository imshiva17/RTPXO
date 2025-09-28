// services/data-sample-api.ts

export interface TrainData {
  id: string
  name: string
  status: "on-time" | "delayed" | "early" | "stopped"
  delay: number
  platform: string
  x: number
  y: number
  speed: number
  lastUpdate: Date
  route: string
  nextStation: string
  eta: string
}

export interface SignalData {
  id: string
  status: "green" | "yellow" | "red"
  x: number
  y: number
  lastUpdate: Date
  location: string
}

export interface SystemMetrics {
  totalTrains: number
  onTimePerformance: number
  averageDelay: number
  activeAlerts: number
  networkEfficiency: number
  lastUpdated: Date
}

export async function updateTrainStatus(trainId: string, status: string, delayMinutes: number) {
  return { success: true, trainId, status, delayMinutes }
}

export async function resolveConflict(conflictId: string, resolution: string) {
  return { success: true, conflictId, resolution }
}

export async function acceptRecommendation(recommendationId: string, controllerId: string) {
  return { success: true, recommendationId, controllerId }
}
