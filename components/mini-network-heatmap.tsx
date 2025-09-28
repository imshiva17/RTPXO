"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Expand, RefreshCw } from "lucide-react"
import type { Train, Station, Conflict } from "@/lib/types"

interface MiniNetworkHeatmapProps {
  trains: Train[]
  stations: Station[]
  conflicts: Conflict[]
  onExpandMap: () => void
}

export function MiniNetworkHeatmap({ trains, stations, conflicts, onExpandMap }: MiniNetworkHeatmapProps) {
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)

  // Calculate congestion levels for each segment
  const getSegmentCongestion = (stationId: string) => {
    const trainsAtStation = trains.filter((t) => t.currentStation === stationId).length
    const conflictsAtStation = conflicts.filter((c) =>
      c.trains.some((trainId) => trains.find((t) => t.id === trainId)?.currentStation === stationId),
    ).length

    if (conflictsAtStation > 0) return "critical"
    if (trainsAtStation >= 3) return "high"
    if (trainsAtStation >= 2) return "medium"
    return "low"
  }

  const getCongestionColor = (level: string) => {
    switch (level) {
      case "critical":
        return "bg-destructive"
      case "high":
        return "bg-chart-3"
      case "medium":
        return "bg-chart-1"
      case "low":
        return "bg-primary"
      default:
        return "bg-muted"
    }
  }

  const getCongestionText = (level: string) => {
    switch (level) {
      case "critical":
        return "Critical"
      case "high":
        return "High"
      case "medium":
        return "Medium"
      case "low":
        return "Normal"
      default:
        return "Unknown"
    }
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Network Congestion Heatmap</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">Real-time segment analysis • Hover for details</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={autoRefresh ? "text-primary" : "text-muted-foreground"}
            >
              <RefreshCw className={`h-4 w-4 ${autoRefresh ? "animate-spin" : ""}`} />
            </Button>
            <Button variant="outline" size="sm" onClick={onExpandMap}>
              <Expand className="h-4 w-4 mr-1" />
              Expand
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Heatmap Visualization */}
        <div className="relative">
          <div className="grid grid-cols-6 gap-2">
            {stations.slice(0, 12).map((station, index) => {
              const congestionLevel = getSegmentCongestion(station.id)
              const trainsCount = trains.filter((t) => t.currentStation === station.id).length

              return (
                <div
                  key={station.id}
                  className={`
                    relative h-12 rounded-lg cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-md
                    ${getCongestionColor(congestionLevel)} ${getCongestionColor(congestionLevel).replace("bg-", "hover:bg-")}/80
                  `}
                  onMouseEnter={() => setHoveredSegment(station.id)}
                  onMouseLeave={() => setHoveredSegment(null)}
                >
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-xs font-medium">
                    <span className="truncate w-full text-center px-1">{station.name.split(" ")[0]}</span>
                    {trainsCount > 0 && <span className="text-xs opacity-90">{trainsCount}</span>}
                  </div>

                  {/* Connection lines */}
                  {index < stations.slice(0, 12).length - 1 && (
                    <div className="absolute top-1/2 -right-1 w-2 h-0.5 bg-muted-foreground/30 transform -translate-y-1/2"></div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Hover tooltip */}
          {hoveredSegment && (
            <div className="absolute top-full left-0 mt-2 p-3 bg-popover border rounded-lg shadow-lg z-10 min-w-48">
              {(() => {
                const station = stations.find((s) => s.id === hoveredSegment)
                const trainsAtStation = trains.filter((t) => t.currentStation === hoveredSegment)
                const congestionLevel = getSegmentCongestion(hoveredSegment)

                return (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm">{station?.name}</h4>
                      <Badge variant="outline" className="text-xs">
                        {getCongestionText(congestionLevel)}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>Active Trains: {trainsAtStation.length}</p>
                      <p>Platform Status: {station?.platforms || 4} platforms</p>
                      {trainsAtStation.length > 0 && (
                        <div>
                          <p className="font-medium">Current Trains:</p>
                          {trainsAtStation.slice(0, 3).map((train) => (
                            <p key={train.id} className="ml-2">
                              • {train.number} ({train.type})
                            </p>
                          ))}
                          {trainsAtStation.length > 3 && (
                            <p className="ml-2 text-muted-foreground">+{trainsAtStation.length - 3} more</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })()}
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-primary rounded"></div>
              <span className="text-muted-foreground">Normal</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-chart-1 rounded"></div>
              <span className="text-muted-foreground">Medium</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-chart-3 rounded"></div>
              <span className="text-muted-foreground">High</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-destructive rounded"></div>
              <span className="text-muted-foreground">Critical</span>
            </div>
          </div>
          <span className="text-muted-foreground">Auto-refresh: {autoRefresh ? "ON" : "OFF"}</span>
        </div>
      </CardContent>
    </Card>
  )
}
