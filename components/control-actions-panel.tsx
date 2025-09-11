"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { Train } from "@/lib/types"
import { Settings, Play, Pause, RotateCcw, AlertTriangle, Clock, Zap } from "lucide-react"

interface ControlActionsPanelProps {
  trains: Train[]
  selectedTrain: string | null
  onTrainAction: (trainId: string, action: string) => void
}

export function ControlActionsPanel({ trains, selectedTrain, onTrainAction }: ControlActionsPanelProps) {
  const [delayInjection, setDelayInjection] = useState({
    trainId: "",
    minutes: 5,
    reason: "",
  })
  const [manualOverride, setManualOverride] = useState({
    trainId: "",
    action: "hold",
    duration: 10,
  })

  const selectedTrainData = selectedTrain ? trains.find((t) => t.id === selectedTrain) : null

  const handleDelayInjection = () => {
    if (delayInjection.trainId && delayInjection.minutes > 0) {
      onTrainAction(delayInjection.trainId, `inject_delay_${delayInjection.minutes}_${delayInjection.reason}`)
      setDelayInjection({ trainId: "", minutes: 5, reason: "" })
    }
  }

  const handleManualOverride = () => {
    if (manualOverride.trainId) {
      onTrainAction(manualOverride.trainId, `${manualOverride.action}_${manualOverride.duration}`)
      setManualOverride({ trainId: "", action: "hold", duration: 10 })
    }
  }

  return (
    <div className="h-full flex flex-col">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Manual Controls
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-6">
            {/* Selected Train Quick Actions */}
            {selectedTrainData && (
              <Card className="border-l-4 border-l-primary">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Quick Actions - {selectedTrainData.number}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <Button size="sm" variant="outline" onClick={() => onTrainAction(selectedTrainData.id, "hold_5")}>
                      <Pause className="h-4 w-4 mr-2" />
                      Hold 5m
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => onTrainAction(selectedTrainData.id, "proceed")}>
                      <Play className="h-4 w-4 mr-2" />
                      Proceed
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onTrainAction(selectedTrainData.id, "priority_up")}
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      Priority+
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => onTrainAction(selectedTrainData.id, "reroute")}>
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Reroute
                    </Button>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Current Status:</span>
                      <Badge variant="outline">{selectedTrainData.status}</Badge>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span>Current Delay:</span>
                      <span>{selectedTrainData.delay}m</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Delay Injection */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Inject Delay (Simulation)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label htmlFor="delay-train" className="text-xs">
                    Select Train
                  </Label>
                  <select
                    id="delay-train"
                    value={delayInjection.trainId}
                    onChange={(e) => setDelayInjection((prev) => ({ ...prev, trainId: e.target.value }))}
                    className="w-full mt-1 px-3 py-2 text-sm border border-input bg-background rounded-md"
                  >
                    <option value="">Choose train...</option>
                    {trains.map((train) => (
                      <option key={train.id} value={train.id}>
                        {train.number} - {train.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="delay-minutes" className="text-xs">
                    Delay (minutes)
                  </Label>
                  <Input
                    id="delay-minutes"
                    type="number"
                    min="1"
                    max="60"
                    value={delayInjection.minutes}
                    onChange={(e) =>
                      setDelayInjection((prev) => ({
                        ...prev,
                        minutes: Number.parseInt(e.target.value) || 5,
                      }))
                    }
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="delay-reason" className="text-xs">
                    Reason
                  </Label>
                  <Input
                    id="delay-reason"
                    placeholder="e.g., Signal failure, Weather"
                    value={delayInjection.reason}
                    onChange={(e) => setDelayInjection((prev) => ({ ...prev, reason: e.target.value }))}
                    className="mt-1"
                  />
                </div>

                <Button
                  size="sm"
                  className="w-full"
                  onClick={handleDelayInjection}
                  disabled={!delayInjection.trainId || delayInjection.minutes <= 0}
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Inject Delay
                </Button>
              </CardContent>
            </Card>

            {/* Manual Override */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Manual Override
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label htmlFor="override-train" className="text-xs">
                    Select Train
                  </Label>
                  <select
                    id="override-train"
                    value={manualOverride.trainId}
                    onChange={(e) => setManualOverride((prev) => ({ ...prev, trainId: e.target.value }))}
                    className="w-full mt-1 px-3 py-2 text-sm border border-input bg-background rounded-md"
                  >
                    <option value="">Choose train...</option>
                    {trains.map((train) => (
                      <option key={train.id} value={train.id}>
                        {train.number} - {train.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="override-action" className="text-xs">
                    Action
                  </Label>
                  <select
                    id="override-action"
                    value={manualOverride.action}
                    onChange={(e) => setManualOverride((prev) => ({ ...prev, action: e.target.value }))}
                    className="w-full mt-1 px-3 py-2 text-sm border border-input bg-background rounded-md"
                  >
                    <option value="hold">Hold at Signal</option>
                    <option value="proceed">Proceed Immediately</option>
                    <option value="reroute">Reroute via Alternate</option>
                    <option value="priority_change">Change Priority</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="override-duration" className="text-xs">
                    Duration (minutes)
                  </Label>
                  <Input
                    id="override-duration"
                    type="number"
                    min="1"
                    max="30"
                    value={manualOverride.duration}
                    onChange={(e) =>
                      setManualOverride((prev) => ({
                        ...prev,
                        duration: Number.parseInt(e.target.value) || 10,
                      }))
                    }
                    className="mt-1"
                  />
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  className="w-full bg-transparent"
                  onClick={handleManualOverride}
                  disabled={!manualOverride.trainId}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Apply Override
                </Button>
              </CardContent>
            </Card>

            {/* Emergency Actions */}
            <Card className="border-destructive/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  Emergency Controls
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-xs">Emergency actions require supervisor approval</AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 gap-2">
                  <Button size="sm" variant="destructive" disabled>
                    Emergency Stop All
                  </Button>
                  <Button size="sm" variant="outline" disabled>
                    Clear All Signals
                  </Button>
                  <Button size="sm" variant="outline" disabled>
                    Activate Backup Route
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* System Information */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">System Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Controller ID:</span>
                  <span className="font-mono">CTRL-001</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Section:</span>
                  <span>NDLS-GZB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shift:</span>
                  <span>Day (06:00-14:00)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Sync:</span>
                  <span>2 min ago</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </CardContent>
    </div>
  )
}
