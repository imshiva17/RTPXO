"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, Activity, TrainIcon, TrendingUp, TrendingDown, Minus, CloudRain, Signal } from "lucide-react"
import type { Train, Conflict, KPI } from "@/lib/types"

interface RealTimeSummaryProps {
  trains: Train[]
  conflicts: Conflict[]
  kpis: KPI | null
  lastUpdate: Date
}

export function RealTimeSummary({ trains, conflicts, kpis, lastUpdate }: RealTimeSummaryProps) {
  const totalTrains = trains.length
  const delayedTrains = trains.filter((t) => t.delay > 0).length
  const averageDelay = delayedTrains > 0 ? trains.reduce((sum, t) => sum + t.delay, 0) / delayedTrains : 0
  const trackAvailability = 95.2 // Mock data
  const signalFailures = 0 // Mock data
  const weatherAlerts = 0 // Mock data

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
      trend: getTrendIcon(totalTrains, 18),
      status: totalTrains > 15 ? "High Traffic" : "Normal",
    },
    {
      title: "Delayed Trains",
      value: delayedTrains,
      unit: `(${averageDelay.toFixed(1)}m avg)`,
      icon: Clock,
      color: delayedTrains > 5 ? "destructive" : delayedTrains > 2 ? "chart-3" : "primary",
      trend: getTrendIcon(delayedTrains, 3),
      status: delayedTrains === 0 ? "On Time" : delayedTrains <= 3 ? "Minor Delays" : "Critical",
    },
    {
      title: "Track Availability",
      value: trackAvailability,
      unit: "%",
      icon: Activity,
      color: trackAvailability >= 95 ? "primary" : trackAvailability >= 85 ? "chart-1" : "destructive",
      trend: getTrendIcon(trackAvailability, 94.8),
      status: trackAvailability >= 95 ? "Excellent" : "Maintenance",
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
            Last updated: {lastUpdate.toLocaleTimeString("en-IN")} • Auto-refresh: 30s
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
          <span className="text-xs text-muted-foreground">Live</span>
        </div>
      </div>

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
    </div>
  )
}
