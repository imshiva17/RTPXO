import { NextResponse } from "next/server"
import { realTimeEngine } from '../../../lib/real-time-engine'
import { REAL_TIME_SENSOR_DATA } from '../../../data/raw-datasets'

export async function GET() {
  try {
    const systemState = realTimeEngine.getSystemState()
    const signals = systemState.signals.map(signal => ({
      ...signal,
      x: signal.coordinates.lng * 100,
      y: signal.coordinates.lat * 100,
      lastUpdate: new Date().toISOString(),
      location: signal.stationId
    }))

    const sensorSignals = REAL_TIME_SENSOR_DATA.signalStatus.map(sensor => ({
      id: sensor.signalId,
      status: sensor.status,
      x: Math.random() * 500 + 100,
      y: Math.random() * 300 + 100,
      lastUpdate: new Date(sensor.timestamp).toISOString(),
      location: sensor.location
    }))

    return NextResponse.json([...signals, ...sensorSignals])
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
