// Core data types for the train traffic controller system

export interface Station {
  id: string
  name: string
  code: string
  coordinates: {
    lat: number
    lng: number
  }
  platforms: number
  zone?: string
  division?: string
  signals?: Signal[]
}

export interface Signal {
  id: string
  stationId: string
  name: string
  type: "entry" | "exit" | "intermediate"
  status: "green" | "yellow" | "red"
  coordinates: {
    lat: number
    lng: number
  }
}

export interface Train {
  id: string
  number: string
  name: string
  type: "express" | "freight" | "suburban" | "special" | "maintenance"
  priority: number // 1-10, higher is more priority
  currentStation?: string
  nextStation?: string
  status: "on_time" | "delayed" | "cancelled" | "diverted"
  delay: number // in minutes
  speed: number // km/h
  coordinates: {
    lat: number
    lng: number
  }
  position?: {
    x: number
    y: number
  }
  route?: string
  eta?: string
  schedule: TrainSchedule[]
}

export interface TrainSchedule {
  stationId: string
  arrivalTime: string
  departureTime: string
  platform?: number
  actualArrival?: string
  actualDeparture?: string
  delay: number
}

export interface Conflict {
  id: string
  type: "crossing" | "platform" | "signal" | "track"
  trains: string[] // train IDs involved
  location: string // station or signal ID
  severity: "low" | "medium" | "high" | "critical"
  estimatedDelay: number
  aiRecommendation?: AIRecommendation
}

export interface AIRecommendation {
  id: string
  conflictId: string
  type: "hold" | "proceed" | "reroute" | "priority_change"
  targetTrain: string
  action: string
  reasoning: string
  confidence: number // 0-1
  estimatedImpact: {
    delayReduction: number
    affectedTrains: string[]
  }
  timestamp: string
}

export interface Section {
  id: string
  name: string
  stations: Station[]
  tracks: Track[]
  activeTrains: Train[]
  conflicts: Conflict[]
}

export interface Track {
  id: string
  name: string
  fromStation: string
  toStation: string
  length: number // in km
  maxSpeed: number // km/h
  status: "operational" | "maintenance" | "blocked"
  signals: Signal[]
}

export interface KPI {
  punctuality: number // percentage
  averageDelay: number // minutes
  throughput: number // trains per hour
  conflictsResolved: number
  aiAcceptanceRate: number // percentage of AI recommendations accepted
}

export interface SimulationScenario {
  id: string
  name: string
  description: string
  initialState: {
    trains: Train[]
    delays: { trainId: string; delay: number }[]
    blockages: { trackId: string; duration: number }[]
  }
  expectedOutcome: KPI
}

export interface SimulationState {
  trains: Train[]
  stations: Station[]
  tracks: Track[]
  conflicts: Conflict[]
  timestamp: Date
  kpis: KPI
}
