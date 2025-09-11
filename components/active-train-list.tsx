"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Search, Filter, MapPin, Clock } from "lucide-react"
import type { Train, Station } from "@/lib/types"

interface ActiveTrainListProps {
  trains: Train[]
  stations: Station[]
  selectedTrain: string | null
  onSelectTrain: (trainId: string) => void
}

export function ActiveTrainList({ trains, stations, selectedTrain, onSelectTrain }: ActiveTrainListProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [sortBy, setSortBy] = useState("number")

  const filteredAndSortedTrains = useMemo(() => {
    const filtered = trains.filter((train) => {
      const matchesSearch =
        train.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        train.route.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesType = filterType === "all" || train.type === filterType
      return matchesSearch && matchesType
    })

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "delay":
          return b.delay - a.delay
        case "priority":
          const priorityOrder = { high: 3, medium: 2, low: 1 }
          return (
            (priorityOrder[b.priority as keyof typeof priorityOrder] || 0) -
            (priorityOrder[a.priority as keyof typeof priorityOrder] || 0)
          )
        case "number":
        default:
          return a.number.localeCompare(b.number)
      }
    })
  }, [trains, searchTerm, filterType, sortBy])

  const getTrainProgress = (train: Train) => {
    if (!train.route) return 0
    const routeStations = train.route.split(" - ")
    return Math.random() * 100 // Simplified for demo
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "destructive"
      case "medium":
        return "chart-3"
      case "low":
        return "primary"
      default:
        return "secondary"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "on-time":
        return "primary"
      case "delayed":
        return "chart-3"
      case "cancelled":
        return "destructive"
      default:
        return "secondary"
    }
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Active Trains</CardTitle>
          <Badge variant="outline" className="text-xs">
            {filteredAndSortedTrains.length} of {trains.length}
          </Badge>
        </div>

        {/* Search and Filters */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search trains or routes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-9"
            />
          </div>

          <div className="flex gap-2">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="h-9 flex-1">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="passenger">Passenger</SelectItem>
                <SelectItem value="freight">Freight</SelectItem>
                <SelectItem value="express">Express</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="h-9 flex-1">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="number">Train Number</SelectItem>
                <SelectItem value="delay">Delay Time</SelectItem>
                <SelectItem value="priority">Priority</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="space-y-1 max-h-96 overflow-y-auto">
          {filteredAndSortedTrains.map((train) => {
            const progress = getTrainProgress(train)
            const currentStation = stations.find((s) => s.id === train.currentStation)

            return (
              <div
                key={train.id}
                className={`
                  p-3 border-b cursor-pointer transition-all duration-200 hover:bg-muted/50
                  ${selectedTrain === train.id ? "bg-primary/5 border-l-4 border-l-primary" : ""}
                `}
                onClick={() => onSelectTrain(train.id)}
              >
                <div className="space-y-2">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{train.number}</span>
                      <Badge variant="outline" className="text-xs">
                        {train.type}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="text-xs"
                        style={{
                          backgroundColor: `hsl(var(--${getPriorityColor(train.priority)}) / 0.1)`,
                          borderColor: `hsl(var(--${getPriorityColor(train.priority)}) / 0.3)`,
                          color: `hsl(var(--${getPriorityColor(train.priority)}))`,
                        }}
                      >
                        {train.priority}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2">
                      {train.delay > 0 && (
                        <div className="flex items-center gap-1 text-xs text-chart-3">
                          <Clock className="h-3 w-3" />
                          <span>+{train.delay}m</span>
                        </div>
                      )}
                      <Badge
                        variant="outline"
                        className="text-xs"
                        style={{
                          backgroundColor: `hsl(var(--${getStatusColor(train.status)}) / 0.1)`,
                          borderColor: `hsl(var(--${getStatusColor(train.status)}) / 0.3)`,
                          color: `hsl(var(--${getStatusColor(train.status)}))`,
                        }}
                      >
                        {train.status}
                      </Badge>
                    </div>
                  </div>

                  {/* Route and Location */}
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground truncate">{train.route || "Route not available"}</p>
                    <div className="flex items-center gap-1 text-xs">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {currentStation ? `At ${currentStation.name}` : "Between stations"}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Route Progress</span>
                      <span className="text-muted-foreground">{progress.toFixed(0)}%</span>
                    </div>
                    <Progress value={progress} className="h-1.5" />
                  </div>
                </div>
              </div>
            )
          })}

          {filteredAndSortedTrains.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              <Filter className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No trains match your filters</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
