import { NextResponse } from "next/server"
import { getSimulationScenarios } from "@/lib/sample-data-api"

export async function GET() {
  try {
    const scenarios = await getSimulationScenarios()
    return NextResponse.json({ scenarios })
  } catch (error) {
    console.error("Simulation API error:", error)
    return NextResponse.json({ error: "Failed to fetch simulation scenarios" }, { status: 500 })
  }
}
