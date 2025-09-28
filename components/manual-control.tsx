"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Settings, X, Zap, Clock, AlertTriangle, CheckCircle } from "lucide-react"
import type { Train } from "@/lib/types"

interface ManualControlProps {
  train: Train
  onClose: () => void
  onUpdateTrain: (trainId: string, updates: Partial<Train>) => void
}

export function ManualControl({ train, onClose, onUpdateTrain }: ManualControlProps) {
  const [speed, setSpeed] = useState([train.speed || 60])
  const [priority, setPriority] = useState([train.priority || 5])
  const [isEmergencyMode, setIsEmergencyMode] = useState(false)
  const [selectedAction, setSelectedAction] = useState<string | null>(null)

  const handleSpeedChange = (newSpeed: number[]) => {
    setSpeed(newSpeed)
    onUpdateTrain(train.id, { speed: newSpeed[0] })
  }

  const handlePriorityChange = (newPriority: number[]) => {
    setPriority(newPriority)
    onUpdateTrain(train.id, { priority: newPriority[0] })
  }

  const handleAction = (action: string) => {
    setSelectedAction(action)
    
    switch (action) {
      case 'hold':
        onUpdateTrain(train.id, { 
          status: 'delayed',
          delay: (train.delay || 0) + 10,
          speed: 0
        })
        break
      case 'proceed':
        onUpdateTrain(train.id, { 
          status: 'on_time',
          speed: speed[0]
        })
        break
      case 'emergency':
        setIsEmergencyMode(true)
        onUpdateTrain(train.id, { 
          status: 'delayed',
          speed: 0,
          priority: 10
        })
        break
      case 'reroute':
        onUpdateTrain(train.id, { 
          status: 'diverted',
          delay: (train.delay || 0) + 5
        })
        break
    }
    
    setTimeout(() => setSelectedAction(null), 2000)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-[600px] max-w-[90vw] max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              Manual Control - {train.name}
            </CardTitle>
            <p className="text-sm text-muted-foreground">Train {train.number}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Emergency Mode Toggle */}
          <div className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg">
            <div>
              <div className="font-semibold text-red-800">Emergency Mode</div>
              <div className="text-xs text-red-600">Immediate stop with highest priority</div>
            </div>
            <Switch
              checked={isEmergencyMode}
              onCheckedChange={(checked) => {
                setIsEmergencyMode(checked)
                if (checked) {
                  handleAction('emergency')
                }
              }}
            />
          </div>

          {/* Current Status */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-primary/10 rounded-lg">
              <div className="text-xl font-bold text-primary">{train.speed} km/h</div>
              <div className="text-xs text-muted-foreground">Current Speed</div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-xl font-bold text-blue-600">P{train.priority}</div>
              <div className="text-xs text-muted-foreground">Priority Level</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <Badge variant={train.status === 'on_time' ? 'default' : 'destructive'} className="text-sm">
                {train.status.replace('_', ' ')}
              </Badge>
              <div className="text-xs text-muted-foreground mt-1">Status</div>
            </div>
          </div>

          {/* Speed Control */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-semibold">Speed Control</label>
              <span className="text-sm text-muted-foreground">{speed[0]} km/h</span>
            </div>
            <Slider
              value={speed}
              onValueChange={handleSpeedChange}
              max={160}
              min={0}
              step={5}
              className="w-full"
              disabled={isEmergencyMode}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0 km/h</span>
              <span>80 km/h</span>
              <span>160 km/h</span>
            </div>
          </div>

          {/* Priority Control */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-semibold">Priority Level</label>
              <span className="text-sm text-muted-foreground">P{priority[0]}</span>
            </div>
            <Slider
              value={priority}
              onValueChange={handlePriorityChange}
              max={10}
              min={1}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>P1 (Low)</span>
              <span>P5 (Normal)</span>
              <span>P10 (Critical)</span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-3">
            <label className="font-semibold">Quick Actions</label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant={selectedAction === 'hold' ? 'default' : 'outline'}
                onClick={() => handleAction('hold')}
                disabled={isEmergencyMode}
                className="flex items-center gap-2"
              >
                <Clock className="h-4 w-4" />
                Hold Train
              </Button>
              <Button
                variant={selectedAction === 'proceed' ? 'default' : 'outline'}
                onClick={() => handleAction('proceed')}
                disabled={isEmergencyMode}
                className="flex items-center gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                Proceed
              </Button>
              <Button
                variant={selectedAction === 'reroute' ? 'default' : 'outline'}
                onClick={() => handleAction('reroute')}
                disabled={isEmergencyMode}
                className="flex items-center gap-2"
              >
                <Zap className="h-4 w-4" />
                Reroute
              </Button>
              <Button
                variant={selectedAction === 'emergency' ? 'destructive' : 'outline'}
                onClick={() => handleAction('emergency')}
                className="flex items-center gap-2"
              >
                <AlertTriangle className="h-4 w-4" />
                Emergency Stop
              </Button>
            </div>
          </div>

          {/* Route Information */}
          <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
            <h4 className="font-semibold text-sm">Route Information</h4>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-muted-foreground">Current Station:</span>
                <div className="font-medium">{train.currentStation}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Next Station:</span>
                <div className="font-medium">{train.nextStation}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Delay:</span>
                <div className="font-medium">{train.delay || 0} minutes</div>
              </div>
              <div>
                <span className="text-muted-foreground">ETA:</span>
                <div className="font-medium">{train.eta || 'Calculating...'}</div>
              </div>
            </div>
          </div>

          {/* Action Confirmation */}
          {selectedAction && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-green-800">
                <CheckCircle className="h-4 w-4" />
                <span className="font-medium">Action Applied: {selectedAction.toUpperCase()}</span>
              </div>
            </div>
          )}

          {/* Control Buttons */}
          <div className="flex gap-2 pt-4 border-t">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={onClose}>
              Apply & Close
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}