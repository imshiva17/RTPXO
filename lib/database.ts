// Database connection and query utilities for the train traffic system

export interface DatabaseConfig {
  connectionString: string
}

// Mock database functions for development - replace with actual DB calls in production
export class TrainDatabase {
  private static instance: TrainDatabase

  private constructor() {}

  static getInstance(): TrainDatabase {
    if (!TrainDatabase.instance) {
      TrainDatabase.instance = new TrainDatabase()
    }
    return TrainDatabase.instance
  }

  // Station operations
  async getStations(): Promise<Station[]> {
    // Mock data for development
    return [
      {
        id: "STN001",
        name: "New Delhi Junction",
        code: "NDLS",
        coordinates: { lat: 28.6428, lng: 77.2197 },
        platforms: 16,
        signals: [],
      },
      {
        id: "STN002",
        name: "Ghaziabad Junction",
        code: "GZB",
        coordinates: { lat: 28.6692, lng: 77.4538 },
        platforms: 8,
        signals: [],
      },
      {
        id: "STN003",
        name: "Meerut City",
        code: "MTC",
        coordinates: { lat: 28.9845, lng: 77.7064 },
        platforms: 4,
        signals: [],
      },
    ]
  }

  // Train operations
  async getActiveTrains(): Promise<Train[]> {
    // Mock data for development
    return [
      {
        id: "TRN001",
        number: "12001",
        name: "Shatabdi Express",
        type: "express",
        priority: 9,
        currentStation: "STN001",
        nextStation: "STN002",
        status: "on_time",
        delay: 0,
        speed: 85,
        coordinates: { lat: 28.6428, lng: 77.2197 },
        schedule: [],
      },
      {
        id: "TRN002",
        number: "16032",
        name: "Freight Express",
        type: "freight",
        priority: 3,
        currentStation: "STN002",
        nextStation: "STN003",
        status: "delayed",
        delay: 15,
        speed: 45,
        coordinates: { lat: 28.6692, lng: 77.4538 },
        schedule: [],
      },
    ]
  }

  // Conflict operations
  async getActiveConflicts(): Promise<Conflict[]> {
    return [
      {
        id: "CNF001",
        type: "crossing",
        trains: ["TRN001", "TRN002"],
        location: "STN002",
        severity: "medium",
        estimatedDelay: 8,
      },
    ]
  }

  // AI Recommendation operations
  async getAIRecommendations(conflictId: string): Promise<AIRecommendation[]> {
    return [
      {
        id: "REC001",
        conflictId: conflictId,
        type: "hold",
        targetTrain: "TRN002",
        action: "Hold freight train at Signal GZB-S2 for 5 minutes",
        reasoning: "Allow express train to pass first, minimizing overall delay",
        confidence: 0.87,
        estimatedImpact: {
          delayReduction: 12,
          affectedTrains: ["TRN001", "TRN002"],
        },
        timestamp: new Date().toISOString(),
      },
    ]
  }

  // KPI operations
  async getCurrentKPIs(): Promise<KPI> {
    return {
      punctuality: 78.5,
      averageDelay: 12.3,
      throughput: 24.7,
      conflictsResolved: 15,
      aiAcceptanceRate: 82.1,
    }
  }
}

// Import types
import type { Station, Train, Conflict, AIRecommendation, KPI } from "./types"

export interface QueryResult {
  rows: any[]
  rowCount: number
}

export const db = {
  async query(text: string, params?: any[]): Promise<QueryResult> {
    // Mock implementation for development - replace with actual database connection
    console.log("[v0] Database query:", text, params)

    // Return mock data based on query patterns
    if (text.includes("FROM trains")) {
      return {
        rows: [
          {
            id: "TRN001",
            train_number: "12951",
            name: "Mumbai Rajdhani Express",
            train_type: "express",
            priority: 1,
            current_station_id: "STN001",
            next_station_id: "STN002",
            status: "on_time",
            delay_minutes: 0,
            current_speed_kmh: 85,
            current_station_name: "New Delhi Railway Station",
            next_station_name: "Hazrat Nizamuddin",
          },
        ],
        rowCount: 1,
      }
    }

    if (text.includes("FROM conflicts")) {
      return {
        rows: [
          {
            id: "CNF001",
            conflict_type: "platform",
            location_id: "STN003",
            severity: "medium",
            estimated_delay_minutes: 12,
            status: "active",
            location_name: "Mathura Junction",
            affected_trains_count: 2,
          },
        ],
        rowCount: 1,
      }
    }

    if (text.includes("FROM ai_recommendations")) {
      return {
        rows: [
          {
            id: "REC001",
            conflict_id: "CNF001",
            recommendation_type: "hold",
            target_train_id: "TRN005",
            action_description: "Hold Dehradun Express at MTJ for 8 minutes",
            reasoning:
              "Platform conflict with Grand Trunk Express. Holding lower priority train reduces overall delay.",
            confidence_score: 0.87,
            estimated_delay_reduction: 7,
            status: "pending",
            train_number: "19019",
            train_name: "Dehradun Express",
          },
        ],
        rowCount: 1,
      }
    }

    if (text.includes("FROM kpi_snapshots")) {
      return {
        rows: [
          {
            snapshot_time: new Date().toISOString(),
            punctuality_percentage: 78.5,
            average_delay_minutes: 12.3,
            trains_per_hour: 8.2,
            conflicts_resolved: 3,
            ai_acceptance_rate: 85.7,
          },
        ],
        rowCount: 1,
      }
    }

    if (text.includes("FROM stations")) {
      return {
        rows: [
          {
            id: "STN001",
            name: "New Delhi Railway Station",
            code: "NDLS",
            latitude: 28.6431,
            longitude: 77.2197,
            platforms: 16,
            current_trains: 2,
          },
        ],
        rowCount: 1,
      }
    }

    if (text.includes("FROM signals")) {
      return {
        rows: [
          {
            id: "SIG001",
            station_id: "STN001",
            name: "NDLS Entry Signal A",
            signal_type: "entry",
            status: "green",
            station_name: "New Delhi Railway Station",
          },
        ],
        rowCount: 1,
      }
    }

    // Default empty result for other queries
    return { rows: [], rowCount: 0 }
  },
}
