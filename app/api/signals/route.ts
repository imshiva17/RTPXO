import { NextResponse } from "next/server"

export async function GET() {
  try {
    const statuses = ["green", "yellow", "red"]

    const mockSignals = [
      {
        id: "S001",
        status: statuses[Math.floor(Math.random() * statuses.length)],
        x: 200,
        y: 180,
        lastUpdate: new Date().toISOString(),
        location: "Central Junction",
      },
      {
        id: "S002",
        status: statuses[Math.floor(Math.random() * statuses.length)],
        x: 350,
        y: 130,
        lastUpdate: new Date().toISOString(),
        location: "North Approach",
      },
      {
        id: "S003",
        status: statuses[Math.floor(Math.random() * statuses.length)],
        x: 500,
        y: 230,
        lastUpdate: new Date().toISOString(),
        location: "South Terminal",
      },
    ]

    return NextResponse.json(mockSignals)
  } catch (error) {
    console.error("Error fetching signal data:", error)
    return NextResponse.json({ error: "Failed to fetch signal data" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const signalUpdate = await request.json()

    // In production, this would interface with signal control systems
    console.log("Signal update received:", signalUpdate)

    return NextResponse.json({
      success: true,
      message: "Signal updated successfully",
    })
  } catch (error) {
    console.error("Error updating signal:", error)
    return NextResponse.json({ error: "Failed to update signal" }, { status: 500 })
  }
}
