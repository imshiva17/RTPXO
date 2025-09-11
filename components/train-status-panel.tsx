"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { Train } from "@/lib/types"
import { TrainIcon, Clock, MapPin, Search, AlertTriangle } from "lucide-react"

interface TrainStatusPanelProps {
  trains: Train[]
  selectedTrain: string | null
  onSelectTrain: (trainId: string | null) => void
  isLoading: boolean
}

export function TrainStatusPanel({ trains, selectedTrain, onSelectTrain, isLoading }: TrainStatusPanelProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterType, setFilterType] = useState<string>("all")

  const filteredTrains = trains.filter((train) => {
    const matchesSearch =
      train.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      train.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === "all" || train.status === filterStatus
    const matchesType = filterType === "all" || train.type === filterType

    return matchesSearch && matchesStatus && matchesType
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "on_time":
        return "bg-primary text-primary-foreground"
      case "delayed":
        return "bg-chart-3 text-white"
      case "cancelled":
        return "bg-destructive text-destructive-foreground"
      case "diverted":
        return "bg-chart-5 text-white"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "express":
        return "bg-chart-1 text-white"
      case "freight":
        return "bg-chart-2 text-white"
      case "suburban":
        return "bg-chart-4 text-white"
      case "special":
        return "bg-chart-5 text-white"
      case "maintenance":
        return "bg-muted text-muted-foreground"
      default:
        return "bg-secondary text-secondary-foreground"
    }
  }

  const getPriorityIcon = (priority: number) => {
    if (priority >= 8) return <AlertTriangle className="h-3 w-3 text-destructive" />
    if (priority >= 6) return <Clock className="h-3 w-3 text-chart-3" />
    return null
  }

  return (
    <div className="h-full flex flex-col">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <TrainIcon className="h-5 w-5" />
          Active Trains ({trains.length})
        </CardTitle>

        {/* Search and Filters */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search trains..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="flex-1 px-3 py-2 text-sm border border-input bg-background rounded-md"
            >
              <option value="all">All Status</option>
              <option value="on_time">On Time</option>
              <option value="delayed">Delayed</option>
              <option value="cancelled">Cancelled</option>
              <option value="diverted">Diverted</option>
            </select>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="flex-1 px-3 py-2 text-sm border border-input bg-background rounded-md"
            >
              <option value="all">All Types</option>
              <option value="express">Express</option>
              <option value="freight">Freight</option>
              <option value="suburban">Suburban</option>
              <option value="special">Special</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-full">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-20 bg-muted rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {filteredTrains.map((train) => (
                <Card
                  key={train.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedTrain === train.id ? "ring-2 ring-primary bg-accent/50" : ""
                  }`}
                  onClick={() => onSelectTrain(train.id === selectedTrain ? null : train.id)}
                >
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* Train Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="font-semibold text-sm">{train.number}</div>
                          {getPriorityIcon(train.priority)}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(train.status)} variant="secondary">
                            {train.status.replace("_", " ")}
                          </Badge>
                        </div>
                      </div>

                      {/* Train Name and Type */}
                      <div>
                        <p className="font-medium text-sm text-balance">{train.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={getTypeColor(train.type)} variant="outline">
                            {train.type}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            Priority {train.priority}
                          </Badge>
                        </div>
                      </div>

                      {/* Location and Status */}
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            Current:{" "}
                            <span className="font-medium text-foreground">{train.currentStation || "In Transit"}</span>
                          </span>
                        </div>

                        {train.nextStation && (
                          <div className="flex items-center gap-2">
                            <div className="h-3 w-3 flex items-center justify-center">
                              <div className="h-1 w-1 bg-muted-foreground rounded-full"></div>
                            </div>
                            <span className="text-muted-foreground">
                              Next: <span className="font-medium text-foreground">{train.nextStation}</span>
                            </span>
                          </div>
                        )}

                        {/* Speed and Delay */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span className="text-muted-foreground">{train.speed} km/h</span>
                          </div>

                          {train.delay > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              +{train.delay}m delay
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {selectedTrain === train.id && (
                        <div className="pt-3 border-t space-y-2">
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="text-muted-foreground">Coordinates:</span>
                              <p className="font-mono">
                                {train.coordinates.lat.toFixed(4)}, {train.coordinates.lng.toFixed(4)}
                              </p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Last Update:</span>
                              <p>2 min ago</p>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" className="flex-1 bg-transparent">
                              Track
                            </Button>
                            <Button size="sm" variant="outline" className="flex-1 bg-transparent">
                              Control
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {filteredTrains.length === 0 && (
                <div className="text-center py-8">
                  <TrainIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No trains match your filters</p>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </div>
  )
}
