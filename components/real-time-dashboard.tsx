'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Play, Pause, AlertTriangle, CheckCircle } from 'lucide-react'

interface RealTimeData {
  trains: any[]
  signals: any[]
  conflicts: any[]
  isRunning: boolean
}

export function RealTimeDashboard() {
  const [data, setData] = useState<RealTimeData>({ trains: [], signals: [], conflicts: [], isRunning: false })
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    fetchRealTimeData()
    const interval = setInterval(fetchRealTimeData, 2000)
    return () => clearInterval(interval)
  }, [])

  const fetchRealTimeData = async () => {
    try {
      const response = await fetch('/api/realtime')
      const result = await response.json()
      setData(result)
    } catch (error) {
      console.error('Failed to fetch real-time data:', error)
    }
  }

  const toggleEngine = async () => {
    setIsLoading(true)
    try {
      const action = data.isRunning ? 'stop' : 'start'
      await fetch('/api/realtime', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      })
      await fetchRealTimeData()
    } catch (error) {
      console.error('Failed to toggle engine:', error)
    }
    setIsLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Real-Time Traffic Control</h2>
        <Button 
          onClick={toggleEngine} 
          disabled={isLoading}
          variant={data.isRunning ? "destructive" : "default"}
        >
          {data.isRunning ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
          {data.isRunning ? 'Stop Engine' : 'Start Engine'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${data.isRunning ? 'bg-green-500' : 'bg-red-500'}`} />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Engine:</span>
                <Badge variant={data.isRunning ? "default" : "secondary"}>
                  {data.isRunning ? 'Running' : 'Stopped'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Active Trains:</span>
                <span className="font-semibold">{data.trains.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Active Signals:</span>
                <span className="font-semibold">{data.signals.length}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Active Conflicts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.conflicts.length === 0 ? (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  No conflicts detected
                </div>
              ) : (
                data.conflicts.map((conflict: any) => (
                  <div key={conflict.id} className="p-2 border rounded">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{conflict.type}</span>
                      <Badge variant={
                        conflict.severity === 'critical' ? 'destructive' :
                        conflict.severity === 'high' ? 'destructive' :
                        conflict.severity === 'medium' ? 'default' : 'secondary'
                      }>
                        {conflict.severity}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Trains: {conflict.trains.join(', ')}
                    </p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Live Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>On-Time Performance:</span>
                <span className="font-semibold">
                  {data.trains.filter(t => t.status === 'on_time').length}/{data.trains.length}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Avg Speed:</span>
                <span className="font-semibold">
                  {data.trains.length > 0 
                    ? Math.round(data.trains.reduce((sum, t) => sum + t.speed, 0) / data.trains.length)
                    : 0} km/h
                </span>
              </div>
              <div className="flex justify-between">
                <span>Green Signals:</span>
                <span className="font-semibold text-green-600">
                  {data.signals.filter(s => s.status === 'green').length}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Active Trains</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {data.trains.map((train: any) => (
                <div key={train.id} className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <div className="font-medium">{train.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {train.currentStation} → {train.nextStation}
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={
                      train.status === 'on_time' ? 'default' :
                      train.status === 'delayed' ? 'destructive' : 'secondary'
                    }>
                      {train.status}
                    </Badge>
                    <div className="text-sm text-muted-foreground mt-1">
                      {train.speed} km/h
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Signal Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {data.signals.map((signal: any) => (
                <div key={signal.id} className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <div className="font-medium">{signal.id}</div>
                    <div className="text-sm text-muted-foreground">{signal.stationId}</div>
                  </div>
                  <div className={`w-4 h-4 rounded-full ${
                    signal.status === 'green' ? 'bg-green-500' :
                    signal.status === 'yellow' ? 'bg-yellow-500' : 'bg-red-500'
                  }`} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}