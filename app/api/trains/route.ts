import { NextResponse } from "next/server"
import { realTimeEngine } from '../../../lib/real-time-engine'
import { INDIAN_RAILWAY_STATIONS, TRAIN_SCHEDULES, DataGenerator } from '../../../data/raw-datasets'

export async function GET() {
  try {
    // Ensure engine is running
    if (!realTimeEngine.getSystemState().isRunning) {
      realTimeEngine.start()
    }
    
    const systemState = realTimeEngine.getSystemState()
    const trains = systemState.trains.map(train => ({
      ...train,
      x: train.coordinates.lng * 100,
      y: train.coordinates.lat * 100,
      lastUpdate: new Date().toISOString(),
      eta: train.eta || `${Math.floor(Math.random() * 15) + 1} min`
    }))

    return NextResponse.json(trains)
  } catch (error) {
    console.error("Error fetching train data:", error)
    return NextResponse.json({ error: "Failed to fetch train data" }, { status: 500 })
  }
}

// Update train data
export async function POST(request: Request) {
  try {
    const trainUpdate = await request.json()

    // In production, this would update the railway management system
    console.log("Train update received:", trainUpdate)

    return NextResponse.json({
      success: true,
      message: "Train data updated successfully",
    })
  } catch (error) {
    console.error("Error updating train data:", error)
    return NextResponse.json({ error: "Failed to update train data" }, { status: 500 })
  }
}
