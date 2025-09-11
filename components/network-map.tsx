"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Train, Station, Conflict } from "@/lib/types"
import { MapPin, TrainIcon, AlertTriangle, Navigation } from "lucide-react"

interface NetworkMapProps {
  trains: Train[]
  stations: Station[]
  conflicts: Conflict[]
  selectedTrain: string | null
  onSelectTrain: (trainId: string | null) => void
}

export function NetworkMap({ trains, stations, conflicts, selectedTrain, onSelectTrain }: NetworkMapProps) {
  const [mapView, setMapView] = useState<"network" | "schematic">("schematic")

  const getTrainStatusColor = (train: Train) => {
    switch (train.status) {
      case "on_time":
        return "bg-primary"
      case "delayed":
        return "bg-chart-3"
      case "cancelled":
        return "bg-destructive"
      case "diverted":
        return "bg-chart-5"
      default:
        return "bg-muted"
    }
  }

  const getConflictSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "text-destructive"
      case "high":
        return "text-chart-4"
      case "medium":
        return "text-chart-3"
      case "low":
        return "text-muted-foreground"
      default:
        return "text-muted-foreground"
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Map Controls */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Button
            variant={mapView === "schematic" ? "default" : "outline"}
            size="sm"
            onClick={() => setMapView("schematic")}
          >
            Schematic View
          </Button>
          <Button
            variant={mapView === "network" ? "default" : "outline"}
            size="sm"
            onClick={() => setMapView("network")}
          >
            Network View
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            <div className="w-2 h-2 bg-primary rounded-full mr-1"></div>
            On Time
          </Badge>
          <Badge variant="outline" className="text-xs">
            <div className="w-2 h-2 bg-chart-3 rounded-full mr-1"></div>
            Delayed
          </Badge>
          <Badge variant="outline" className="text-xs">
            <div className="w-2 h-2 bg-destructive rounded-full mr-1"></div>
            Critical
          </Badge>
        </div>
      </div>

      {/* Map Content */}
      <div className="flex-1 relative overflow-hidden">
        {mapView === "schematic" ? (
          <SchematicView
            trains={trains}
            stations={stations}
            conflicts={conflicts}
            selectedTrain={selectedTrain}
            onSelectTrain={onSelectTrain}
            getTrainStatusColor={getTrainStatusColor}
            getConflictSeverityColor={getConflictSeverityColor}
          />
        ) : (
          <NetworkView
            trains={trains}
            stations={stations}
            conflicts={conflicts}
            selectedTrain={selectedTrain}
            onSelectTrain={onSelectTrain}
            getTrainStatusColor={getTrainStatusColor}
          />
        )}
      </div>
    </div>
  )
}

function SchematicView({
  trains,
  stations,
  conflicts,
  selectedTrain,
  onSelectTrain,
  getTrainStatusColor,
  getConflictSeverityColor,
}: any) {
  return (
    <div className="h-full p-6 bg-muted/20">
      {/* Railway Line Schematic */}
      <div className="relative">
        {/* Main Track Line */}
        <div className="absolute top-1/2 left-0 right-0 h-1 bg-border transform -translate-y-1/2"></div>

        {/* Stations */}
        <div className="flex justify-between items-center relative z-10">
          {stations.map((station, index) => (
            <div key={station.id} className="flex flex-col items-center">
              {/* Station Icon */}
              <div className="bg-card border-2 border-primary rounded-full p-3 mb-2">
                <MapPin className="h-6 w-6 text-primary" />
              </div>

              {/* Station Info */}
              <div className="text-center">
                <p className="font-semibold text-sm text-foreground">{station.name}</p>
                <p className="text-xs text-muted-foreground">{station.code}</p>
                <Badge variant="outline" className="text-xs mt-1">
                  {station.platforms} platforms
                </Badge>
              </div>

              {/* Trains at Station */}
              <div className="mt-4 space-y-2">
                {trains
                  .filter((train) => train.currentStation === station.id)
                  .map((train) => (
                    <Card
                      key={train.id}
                      className={`cursor-pointer transition-all ${
                        selectedTrain === train.id ? "ring-2 ring-primary" : ""
                      }`}
                      onClick={() => onSelectTrain(train.id)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${getTrainStatusColor(train)}`}></div>
                          <div>
                            <p className="font-medium text-sm">{train.number}</p>
                            <p className="text-xs text-muted-foreground">{train.name}</p>
                            {train.delay > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                +{train.delay}m
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>

              {/* Conflicts at Station */}
              {conflicts
                .filter((conflict) => conflict.location === station.id)
                .map((conflict) => (
                  <div key={conflict.id} className="mt-2">
                    <Badge variant="destructive" className="text-xs">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      {conflict.type} conflict
                    </Badge>
                  </div>
                ))}
            </div>
          ))}
        </div>

        {/* Moving Trains Between Stations */}
        <div className="absolute top-1/2 left-0 right-0 transform -translate-y-1/2">
          {trains
            .filter((train) => train.currentStation !== train.nextStation && train.speed > 0)
            .map((train, index) => (
              <div
                key={train.id}
                className={`absolute cursor-pointer ${getTrainStatusColor(train)} rounded-full p-2 transform -translate-x-1/2 -translate-y-1/2 ${
                  selectedTrain === train.id ? "ring-2 ring-primary scale-110" : ""
                }`}
                style={{
                  left: `${25 + index * 20}%`,
                  top: `${index % 2 === 0 ? "-20px" : "20px"}`,
                }}
                onClick={() => onSelectTrain(train.id)}
              >
                <TrainIcon className="h-4 w-4 text-white" />
                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                  <Badge variant="outline" className="text-xs">
                    {train.number} ({train.speed} km/h)
                  </Badge>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Conflict Details */}
      {conflicts.length > 0 && (
        <div className="mt-8">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Active Conflicts
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {conflicts.map((conflict) => (
              <Card key={conflict.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className={getConflictSeverityColor(conflict.severity)}>
                      {conflict.severity}
                    </Badge>
                    <Badge variant="secondary">{conflict.type}</Badge>
                  </div>
                  <p className="text-sm font-medium">Trains: {conflict.trains.join(", ")}</p>
                  <p className="text-xs text-muted-foreground mt-1">Est. delay: {conflict.estimatedDelay}m</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function NetworkView({ trains, stations, conflicts, selectedTrain, onSelectTrain, getTrainStatusColor }: any) {
  return (
    <div className="h-full flex items-center justify-center bg-muted/10">
      <div className="text-center">
        <Navigation className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Geographic Network View</h3>
        <p className="text-muted-foreground mb-4">Interactive map view with real-time train positions</p>
        <Badge variant="outline">Coming Soon</Badge>
      </div>
    </div>
  )
}
