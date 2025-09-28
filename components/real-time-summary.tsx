"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Clock, Activity, TrainIcon, TrendingUp, TrendingDown, Minus, CloudRain, Signal, MapPin } from "lucide-react"
import type { Train, Conflict, KPI } from "@/lib/types"

interface RealTimeSummaryProps {
  trains: Train[]
  conflicts: Conflict[]
  kpis: KPI | null
  lastUpdate: Date
}

interface StationTraffic {
  stationName: string
  arrivals: number
  departures: number
  currentTrains: number
  avgDelay: number
  status: 'normal' | 'busy' | 'congested'
}

export function RealTimeSummary({ trains, conflicts, kpis, lastUpdate }: RealTimeSummaryProps) {
  const [activeTab, setActiveTab] = useState("status")
  
  const totalTrains = trains.length
  const delayedTrains = trains.filter((t) => t.status === 'delayed').length
  const averageDelay = delayedTrains > 0 ? trains.filter(t => t.status === 'delayed').reduce((sum, t) => sum + t.delay, 0) / delayedTrains : 0
  const onTimeTrains = trains.filter((t) => t.status === 'on_time').length
  // Calculate track availability based on railway operational metrics
  const baseAvailability = 98.5 // Standard railway track availability
  const conflictImpact = Math.min(15, conflicts.length * 2.5) // Each conflict reduces availability by 2.5%
  const delayImpact = Math.min(10, (delayedTrains / Math.max(1, totalTrains)) * 20) // Delays impact availability
  const trackAvailability = Math.round(Math.max(75, baseAvailability - conflictImpact - delayImpact) * 10) / 10
  const signalFailures = conflicts.filter(c => c.type === 'signal').length + (delayedTrains > 3 ? 1 : 0)
  const weatherAlerts = Math.random() > 0.85 ? 1 : 0 // Random weather events
  
  // Generate station traffic data
  const generateStationTraffic = (): StationTraffic[] => {
    const stations = ['New Delhi', 'Ghaziabad', 'Meerut City', 'Saharanpur', 'Ambala', 'Kurukshetra']
    return stations.map(station => {
      const stationTrains = trains.filter(t => t.currentStation === station || t.nextStation === station)
      const arrivals = Math.floor(Math.random() * 8) + 2
      const departures = Math.floor(Math.random() * 8) + 2
      const currentTrains = stationTrains.length
      const avgDelay = stationTrains.length > 0 ? 
        stationTrains.reduce((sum, t) => sum + t.delay, 0) / stationTrains.length : 0
      const totalActivity = arrivals + departures + currentTrains
      
      return {
        stationName: station,
        arrivals,
        departures,
        currentTrains,
        avgDelay: Math.round(avgDelay),
        status: totalActivity > 12 ? 'congested' : totalActivity > 8 ? 'busy' : 'normal'
      }
    })
  }
  
  const stationTraffic = generateStationTraffic()

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) return <TrendingUp className="h-3 w-3 text-chart-3" />
    if (current < previous) return <TrendingDown className="h-3 w-3 text-primary" />
    return <Minus className="h-3 w-3 text-muted-foreground" />
  }

  const summaryCards = [
    {
      title: "Active Trains",
      value: totalTrains,
      unit: "",
      icon: TrainIcon,
      color: "primary",
      trend: getTrendIcon(totalTrains, 12),
      status: totalTrains > 15 ? "High Traffic" : "Normal",
    },
    {
      title: "Delayed Trains",
      value: delayedTrains,
      unit: delayedTrains > 0 ? `(${averageDelay.toFixed(1)}m avg)` : "",
      icon: Clock,
      color: delayedTrains > 5 ? "destructive" : delayedTrains > 2 ? "chart-3" : "primary",
      trend: getTrendIcon(delayedTrains, 7),
      status: delayedTrains === 0 ? "On Time" : delayedTrains <= 3 ? "Normal" : "Critical",
    },
    {
      title: "Track Availability",
      value: trackAvailability,
      unit: "%",
      icon: Activity,
      color: trackAvailability >= 95 ? "primary" : trackAvailability >= 85 ? "chart-1" : "destructive",
      trend: getTrendIcon(trackAvailability, 95.2),
      status: trackAvailability >= 95 ? "Excellent" : trackAvailability >= 85 ? "Good" : trackAvailability >= 75 ? "Fair" : "Maintenance",
    },
    {
      title: "Signal Status",
      value: signalFailures,
      unit: "failures",
      icon: Signal,
      color: signalFailures === 0 ? "primary" : "destructive",
      trend: getTrendIcon(signalFailures, 1),
      status: signalFailures === 0 ? "All Clear" : "Issues",
    },
    {
      title: "Weather Alerts",
      value: weatherAlerts,
      unit: "active",
      icon: CloudRain,
      color: weatherAlerts === 0 ? "primary" : "chart-3",
      trend: getTrendIcon(weatherAlerts, 0),
      status: weatherAlerts === 0 ? "Clear" : "Monitoring",
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Real-Time System Status</h3>
          <p className="text-sm text-muted-foreground">
            Auto-refresh: 30s • Live monitoring active
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
          <span className="text-xs text-muted-foreground">Live</span>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="status">System Status</TabsTrigger>
          <TabsTrigger value="traffic">Station Traffic</TabsTrigger>
        </TabsList>
        
        <TabsContent value="status" className="mt-4">
          <div className="grid grid-cols-5 gap-4">
            {summaryCards.map((card, index) => {
              const IconComponent = card.icon
              return (
                <Card
                  key={index}
                  className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-l-4"
                  style={{ borderLeftColor: `hsl(var(--${card.color}))` }}
                >
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div
                          className="p-2 rounded-lg transition-colors group-hover:scale-110 duration-300"
                          style={{ backgroundColor: `hsl(var(--${card.color}) / 0.1)` }}
                        >
                          <IconComponent className="h-5 w-5" style={{ color: `hsl(var(--${card.color}))` }} />
                        </div>
                        <div className="flex items-center gap-1">{card.trend}</div>
                      </div>

                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                          {card.title}
                        </p>
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-bold text-foreground">{card.value}</span>
                          <span className="text-xs text-muted-foreground">{card.unit}</span>
                        </div>
                      </div>

                      <Badge
                        variant="outline"
                        className="text-xs px-2 py-1 w-full justify-center"
                        style={{
                          backgroundColor: `hsl(var(--${card.color}) / 0.1)`,
                          borderColor: `hsl(var(--${card.color}) / 0.3)`,
                          color: `hsl(var(--${card.color}))`,
                        }}
                      >
                        {card.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>
        
        <TabsContent value="traffic" className="mt-4">
          <div className="grid grid-cols-3 gap-4">
            {stationTraffic.map((station, index) => (
              <Card key={index} className="hover:shadow-lg transition-all duration-300">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary" />
                        <h4 className="font-semibold text-sm">{station.stationName}</h4>
                      </div>
                      <Badge 
                        variant={station.status === 'normal' ? 'default' : station.status === 'busy' ? 'secondary' : 'destructive'}
                        className="text-xs"
                      >
                        {station.status}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="text-center p-2 bg-green-50 rounded">
                        <div className="font-bold text-green-600">{station.arrivals}</div>
                        <div className="text-muted-foreground">Arrivals</div>
                      </div>
                      <div className="text-center p-2 bg-blue-50 rounded">
                        <div className="font-bold text-blue-600">{station.departures}</div>
                        <div className="text-muted-foreground">Departures</div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between text-xs">
                      <span>Current: <strong>{station.currentTrains}</strong></span>
                      <span>Avg Delay: <strong>{station.avgDelay}m</strong></span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
