"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AlertTriangle, Clock, Settings, Wifi, WifiOff, CheckCircle, Info, Volume2, VolumeX } from "lucide-react"
import type { Conflict, AIRecommendation } from "@/lib/types"

interface AlertConflictFeedProps {
  conflicts: Conflict[]
  recommendations: AIRecommendation[]
}

interface SystemAlert {
  id: string
  type: "conflict" | "warning" | "intervention" | "system"
  severity: "critical" | "high" | "medium" | "low"
  title: string
  message: string
  timestamp: Date
  acknowledged: boolean
}

export function AlertConflictFeed({ conflicts, recommendations }: AlertConflictFeedProps) {
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [filter, setFilter] = useState<"all" | "unacknowledged">("all")
  const [acknowledgedAlerts, setAcknowledgedAlerts] = useState<Set<string>>(new Set())

  // Generate system alerts from conflicts and other sources
  const systemAlerts: SystemAlert[] = [
    ...conflicts.map((conflict) => ({
      id: conflict.id,
      type: "conflict" as const,
      severity: conflict.severity,
      title: `${conflict.type.charAt(0).toUpperCase() + conflict.type.slice(1)} Conflict`,
      message: `Conflict detected at ${conflict.location} involving ${conflict.involvedTrains.length} trains`,
      timestamp: conflict.detectedAt,
      acknowledged: acknowledgedAlerts.has(conflict.id),
    })),
    // Mock additional alerts
    {
      id: "warn-1",
      type: "warning" as const,
      severity: "medium" as const,
      title: "Maintenance Window Overlap",
      message: "Track maintenance scheduled during peak hours on Platform 3",
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
      acknowledged: acknowledgedAlerts.has("warn-1"),
    },
    {
      id: "sys-1",
      type: "system" as const,
      severity: "low" as const,
      title: "Sensor Connectivity",
      message: "Signal sensor at KM 45.2 reporting intermittent connectivity",
      timestamp: new Date(Date.now() - 8 * 60 * 1000),
      acknowledged: acknowledgedAlerts.has("sys-1"),
    },
    {
      id: "int-1",
      type: "intervention" as const,
      severity: "high" as const,
      title: "Manual Override Applied",
      message: "Controller manually overrode AI recommendation for Train 12345",
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      acknowledged: acknowledgedAlerts.has("int-1"),
    },
  ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

  const filteredAlerts = systemAlerts.filter((alert) => filter === "all" || !alert.acknowledged)

  const getAlertIcon = (type: string, severity: string) => {
    switch (type) {
      case "conflict":
        return <AlertTriangle className="h-4 w-4" />
      case "warning":
        return <Clock className="h-4 w-4" />
      case "intervention":
        return <Settings className="h-4 w-4" />
      case "system":
        return severity === "critical" ? <WifiOff className="h-4 w-4" /> : <Wifi className="h-4 w-4" />
      default:
        return <Info className="h-4 w-4" />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "destructive"
      case "high":
        return "chart-3"
      case "medium":
        return "chart-1"
      case "low":
        return "primary"
      default:
        return "secondary"
    }
  }

  const handleAcknowledge = (alertId: string) => {
    setAcknowledgedAlerts((prev) => new Set([...prev, alertId]))
  }

  const unacknowledgedCount = systemAlerts.filter((alert) => !alert.acknowledged).length

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base font-semibold">Alert & Conflict Feed</CardTitle>
            {unacknowledgedCount > 0 && (
              <Badge variant="destructive" className="text-xs animate-pulse">
                {unacknowledgedCount}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={soundEnabled ? "text-primary" : "text-muted-foreground"}
            >
              {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </Button>

            <Button
              variant={filter === "unacknowledged" ? "default" : "ghost"}
              size="sm"
              onClick={() => setFilter(filter === "all" ? "unacknowledged" : "all")}
              className="text-xs"
            >
              {filter === "all" ? "All" : "New"}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <ScrollArea className="h-80">
          <div className="space-y-1 p-3">
            {filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`
                  p-3 rounded-lg border transition-all duration-200 hover:shadow-sm
                  ${alert.acknowledged ? "bg-muted/30 border-muted" : "bg-background border-border"}
                  ${!alert.acknowledged && alert.severity === "critical" ? "animate-pulse" : ""}
                `}
              >
                <div className="space-y-2">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1">
                      <div
                        className="p-1 rounded"
                        style={{
                          backgroundColor: `hsl(var(--${getSeverityColor(alert.severity)}) / 0.1)`,
                          color: `hsl(var(--${getSeverityColor(alert.severity)}))`,
                        }}
                      >
                        {getAlertIcon(alert.type, alert.severity)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{alert.title}</h4>
                        <p className="text-xs text-muted-foreground">{alert.timestamp.toLocaleTimeString("en-IN")}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <Badge
                        variant="outline"
                        className="text-xs"
                        style={{
                          backgroundColor: `hsl(var(--${getSeverityColor(alert.severity)}) / 0.1)`,
                          borderColor: `hsl(var(--${getSeverityColor(alert.severity)}) / 0.3)`,
                          color: `hsl(var(--${getSeverityColor(alert.severity)}))`,
                        }}
                      >
                        {alert.severity}
                      </Badge>

                      {!alert.acknowledged ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAcknowledge(alert.id)}
                          className="h-6 w-6 p-0"
                        >
                          <CheckCircle className="h-3 w-3" />
                        </Button>
                      ) : (
                        <CheckCircle className="h-4 w-4 text-primary" />
                      )}
                    </div>
                  </div>

                  {/* Message */}
                  <p className="text-xs text-muted-foreground leading-relaxed">{alert.message}</p>

                  {/* Actions for conflicts */}
                  {alert.type === "conflict" && !alert.acknowledged && (
                    <div className="flex gap-2 pt-1">
                      <Button variant="outline" size="sm" className="h-6 text-xs bg-transparent">
                        View Details
                      </Button>
                      <Button variant="outline" size="sm" className="h-6 text-xs bg-transparent">
                        Apply AI Fix
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {filteredAlerts.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">{filter === "all" ? "No alerts or conflicts" : "All alerts acknowledged"}</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
