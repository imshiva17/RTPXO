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
