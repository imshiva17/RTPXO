import { NextResponse } from 'next/server'
import { realTimeEngine } from '../../../lib/real-time-engine'

export async function GET() {
  try {
    const systemState = realTimeEngine.getSystemState()
    return NextResponse.json(systemState)
  } catch (error) {
    console.error('Error fetching real-time data:', error)
    return NextResponse.json({ error: 'Failed to fetch real-time data' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { action, data } = await request.json()
    
    switch (action) {
      case 'start':
        realTimeEngine.start()
        return NextResponse.json({ success: true, message: 'Real-time engine started' })
      
      case 'stop':
        realTimeEngine.stop()
        return NextResponse.json({ success: true, message: 'Real-time engine stopped' })
      
      case 'update_train':
        realTimeEngine.updateTrain(data.trainId, data.updates)
        return NextResponse.json({ success: true, message: 'Train updated' })
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error processing real-time request:', error)
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 })
  }
}