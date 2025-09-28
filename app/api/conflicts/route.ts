import { NextResponse } from "next/server"
import { realTimeEngine } from '../../../lib/real-time-engine'

export async function GET() {
  try {
    const systemState = realTimeEngine.getSystemState()
    const conflicts = systemState.conflicts.map(conflict => ({
      ...conflict,
      lastUpdate: new Date().toISOString()
    }))

    return NextResponse.json(conflicts)
  } catch (error) {
    console.error("Error fetching conflicts data:", error)
    return NextResponse.json({ error: "Failed to fetch conflicts data" }, { status: 500 })
  }
}