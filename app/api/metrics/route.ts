import { NextResponse } from "next/server"

export async function GET() {
  try {
    const metrics = {
      totalTrains: 3 + Math.floor(Math.random() * 5),
      onTimePerformance: 85 + Math.random() * 10,
      averageDelay: 3 + Math.random() * 5,
      activeAlerts: Math.floor(Math.random() * 3),
      networkEfficiency: 90 + Math.random() * 8,
      lastUpdated: new Date().toISOString(),
    }

    return NextResponse.json(metrics)
  } catch (error) {
    console.error("Error fetching metrics:", error)
    return NextResponse.json({ error: "Failed to fetch metrics" }, { status: 500 })
  }
}
