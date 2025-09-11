import { NextResponse } from "next/server"

export async function GET() {
  try {
    const data = {
      trains: [
        {
          id: "T001",
          name: "Express 12345",
          status: "on-time",
          delay: 0,
          platform: "A1",
          x: 150,
          y: 200,
          speed: 85,
          lastUpdate: new Date().toISOString(),
          route: "North-South Express",
          nextStation: "Central Station",
          eta: "3 min",
        },
      ],
      signals: [
        {
          id: "S001",
          status: "green",
          x: 200,
          y: 180,
          lastUpdate: new Date().toISOString(),
          location: "Central Junction",
        },
      ],
      metrics: {
        totalTrains: 3,
        onTimePerformance: 85,
        averageDelay: 3,
        activeAlerts: 0,
        networkEfficiency: 90,
        lastUpdated: new Date().toISOString(),
      },
    }
    return NextResponse.json(data)
  } catch (error) {
    console.error("Dashboard API error:", error)
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 })
  }
}
