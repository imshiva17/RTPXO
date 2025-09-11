import { type NextRequest, NextResponse } from "next/server"
import { updateTrainStatus, resolveConflict, acceptRecommendation } from "@/lib/sample-data-api"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, ...params } = body

    let result
    switch (action) {
      case "update_train_status":
        result = await updateTrainStatus(params.trainId, params.status, params.delayMinutes)
        break
      case "resolve_conflict":
        result = await resolveConflict(params.conflictId, params.resolution)
        break
      case "accept_recommendation":
        result = await acceptRecommendation(params.recommendationId, params.controllerId)
        break
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Action API error:", error)
    return NextResponse.json({ error: "Failed to execute action" }, { status: 500 })
  }
}
