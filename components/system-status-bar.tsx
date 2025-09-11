"use client"

import { Badge } from "@/components/ui/badge"
import { CheckCircle, AlertTriangle, AlertCircle, Clock, Wifi, Database } from "lucide-react"

interface SystemStatusBarProps {
  status: "normal" | "caution" | "warning" | "critical"
  message: string
  lastUpdate: Date
}

export function SystemStatusBar({ status, message, lastUpdate }: SystemStatusBarProps) {
  const getStatusIcon = () => {
    switch (status) {
      case "normal":
        return <CheckCircle className="h-4 w-4 text-primary" />
      case "caution":
        return <AlertCircle className="h-4 w-4 text-chart-3" />
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-chart-4" />
      case "critical":
        return <AlertTriangle className="h-4 w-4 text-destructive" />
      default:
        return <CheckCircle className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case "normal":
        return "bg-primary text-primary-foreground"
      case "caution":
        return "bg-chart-3 text-white"
      case "warning":
        return "bg-chart-4 text-white"
      case "critical":
        return "bg-destructive text-destructive-foreground"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-IN", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }

  return (
    <div className="flex items-center gap-4">
      {/* System Status */}
      <div className="flex items-center gap-2">
        {getStatusIcon()}
        <Badge className={getStatusColor()}>{message}</Badge>
      </div>

      {/* Connection Status */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Wifi className="h-4 w-4 text-primary" />
        <span>Connected</span>
      </div>

      {/* Database Status */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Database className="h-4 w-4 text-primary" />
        <span>Online</span>
      </div>

      {/* Last Update */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Clock className="h-4 w-4" />
        <span>Updated: {formatTime(lastUpdate)}</span>
      </div>
    </div>
  )
}
