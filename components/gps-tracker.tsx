"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, Navigation, Clock, Zap, X } from "lucide-react"
import type { Train } from "@/lib/types"
import { TRAIN_SCHEDULES, INDIAN_RAILWAY_STATIONS } from "@/data/raw-datasets"

interface GPSTrackerProps {
  train: Train
  onClose: () => void
}

export function GPSTracker({ train, onClose }: GPSTrackerProps) {
  const [currentPosition, setCurrentPosition] = useState({
    lat: train.coordinates?.lat || 28.6448,
    lng: train.coordinates?.lng || 77.2097
  })
  const [trackingHistory, setTrackingHistory] = useState<Array<{lat: number, lng: number, timestamp: Date}>>([])
  const [remainingDistance, setRemainingDistance] = useState(45)
  const [estimatedTime, setEstimatedTime] = useState(35)
  // Calculate initial progress based on train's journey state
  const getInitialProgress = () => {
    const trainSeed = parseInt(train.number.replace(/\D/g, '')) || 1
    const timeRunning = (Date.now() / 1000) % 3600 // Simulate time running
    const baseProgress = ((trainSeed * 17) % 100) / 100 // Unique starting point per train
    const timeProgress = (timeRunning / 3600) * 0.3 // Add time-based progress
    return Math.min(0.95, baseProgress + timeProgress) // Max 95% to avoid instant completion
  }
  
  const [routeProgress, setRouteProgress] = useState(getInitialProgress())
  // Get train's actual route from schedule data
  const trainSchedule = TRAIN_SCHEDULES.find(s => s.trainNumber === train.number)
  const stationData = trainSchedule ? trainSchedule.route.map(stop => {
    const station = INDIAN_RAILWAY_STATIONS.find(s => s.code === stop.stationCode)
    return {
      name: station?.name || stop.stationCode,
      lat: station?.coordinates.lat || 0,
      lng: station?.coordinates.lng || 0
    }
  }).filter(station => station.lat !== 0 && station.lng !== 0) : [
    { name: 'New Delhi', lat: 28.6448, lng: 77.2097 },
    { name: 'Ghaziabad', lat: 28.6692, lng: 77.4538 },
    { name: 'Moradabad', lat: 28.8386, lng: 78.7733 },
    { name: 'Bareilly', lat: 28.3670, lng: 79.4304 },
    { name: 'Lucknow', lat: 26.8467, lng: 80.9462 }
  ]
  
  // Find train's current position in route
  const getCurrentStationIndex = () => {
    if (!trainSchedule) return 0
    const currentStationCode = INDIAN_RAILWAY_STATIONS.find(s => s.name === train.currentStation)?.code
    const index = trainSchedule.route.findIndex(stop => stop.stationCode === currentStationCode)
    return Math.max(0, index)
  }
  
  // Get unique starting position for each train
  const getTrainStartingIndex = () => {
    const trainSeed = parseInt(train.number.replace(/\D/g, '')) || 1
    return trainSeed % Math.max(1, stationData.length - 1)
  }
  
  const [stationIndex, setStationIndex] = useState(getTrainStartingIndex())
  const [currentStation, setCurrentStation] = useState(stationData[getTrainStartingIndex()]?.name || 'Unknown')
  const [nextStation, setNextStation] = useState(stationData[Math.min(getTrainStartingIndex() + 1, stationData.length - 1)]?.name || 'Unknown')
  const [currentCoords, setCurrentCoords] = useState({ 
    lat: stationData[getTrainStartingIndex()]?.lat || 28.6448, 
    lng: stationData[getTrainStartingIndex()]?.lng || 77.2097 
  })
  const [nextCoords, setNextCoords] = useState({ 
    lat: stationData[Math.min(getTrainStartingIndex() + 1, stationData.length - 1)]?.lat || 28.6692, 
    lng: stationData[Math.min(getTrainStartingIndex() + 1, stationData.length - 1)]?.lng || 77.4538 
  })

  useEffect(() => {
    // Generate unique seed for each train to ensure different movement patterns
    const trainSeed = parseInt(train.number.replace(/\D/g, '')) || 1
    
    const interval = setInterval(() => {
      const speed = train.speed || 60
      const currentSt = stationData[stationIndex]
      const nextSt = stationData[Math.min(stationIndex + 1, stationData.length - 1)]
      
      // Calculate realistic distance between stations
      const stationDistance = Math.sqrt(
        Math.pow((nextSt.lat - currentSt.lat) * 111, 2) + 
        Math.pow((nextSt.lng - currentSt.lng) * 111, 2)
      ) // Approximate km
      
      // Progress increment based on actual speed and distance
      const progressIncrement = (speed / 3600) / (stationDistance || 50) // realistic progress per second
      
      setRouteProgress(prevProgress => {
        const newProgress = Math.min(1, prevProgress + progressIncrement)
        
        // Interpolate coordinates between stations with realistic movement
        const latDiff = nextSt.lat - currentSt.lat
        const lngDiff = nextSt.lng - currentSt.lng
        
        // Add slight variation based on train number for unique paths
        const variation = (trainSeed % 100) / 10000
        
        const newPos = {
          lat: currentSt.lat + (latDiff * newProgress) + (Math.sin(Date.now() / 10000 + trainSeed) * variation),
          lng: currentSt.lng + (lngDiff * newProgress) + (Math.cos(Date.now() / 10000 + trainSeed) * variation)
        }
        
        setCurrentPosition(newPos)
        setCurrentCoords(newPos)
        
        // Update remaining distance based on actual progress
        const remainingDist = stationDistance * (1 - newProgress)
        setRemainingDistance(remainingDist)
        
        // Calculate realistic ETA
        const etaMinutes = (remainingDist / speed) * 60
        setEstimatedTime(etaMinutes)
        
        // Move to next station when progress reaches 100%
        if (newProgress >= 1 && stationIndex < stationData.length - 2) {
          setTimeout(() => {
            setStationIndex(prevIndex => {
              const newIndex = prevIndex + 1
              if (newIndex < stationData.length) {
                setCurrentStation(stationData[newIndex].name)
                if (newIndex + 1 < stationData.length) {
                  setNextStation(stationData[newIndex + 1].name)
                  setNextCoords({ lat: stationData[newIndex + 1].lat, lng: stationData[newIndex + 1].lng })
                } else {
                  setNextStation('Final Destination')
                }
              }
              return newIndex
            })
            setRouteProgress(0)
          }, 500)
        }
        
        return newProgress
      })

    }, 1000) // Update every second for realistic movement

    return () => clearInterval(interval)
  }, [train.speed, stationIndex, train.number])

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-[800px] h-[600px] max-w-[90vw] max-h-[90vh]">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Navigation className="h-5 w-5 text-primary" />
              Live GPS Tracking - {train.name}
            </CardTitle>
            <p className="text-sm text-muted-foreground">Train {train.number}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Current Status */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-primary/10 rounded-lg">
              <div className="text-2xl font-bold text-primary">{train.speed} km/h</div>
              <div className="text-xs text-muted-foreground">Current Speed</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {currentPosition.lat.toFixed(4)}°
              </div>
              <div className="text-xs text-muted-foreground">Latitude</div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {currentPosition.lng.toFixed(4)}°
              </div>
              <div className="text-xs text-muted-foreground">Longitude</div>
            </div>
          </div>

          {/* Route Progress Map */}
          <div className="h-80 bg-gradient-to-br from-green-50 to-blue-50 rounded-lg border-2 border-primary/20 relative overflow-hidden">
            {/* Route Track */}
            <svg className="absolute inset-0 w-full h-full">
              <defs>
                <linearGradient id="trackGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="50%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#6b7280" />
                </linearGradient>
              </defs>
              <path
                d="M 50 200 Q 150 100 250 150 Q 350 200 450 120 Q 550 50 650 100"
                stroke="url(#trackGradient)"
                strokeWidth="4"
                fill="none"
                strokeDasharray="8,4"
              />
            </svg>
            
            {/* Station Markers */}
            {[20, 35, 55, 75, 90].map((progress, idx) => (
              <div
                key={idx}
                className="absolute w-3 h-3 bg-gray-400 rounded-full border-2 border-white shadow"
                style={{
                  left: `${progress}%`,
                  top: `${40 + Math.sin(idx) * 20}%`,
                  transform: 'translate(-50%, -50%)'
                }}
              >
                <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs whitespace-nowrap">
                  S{idx + 1}
                </div>
              </div>
            ))}
            
            {/* Animated Train */}
            <div 
              className="absolute transition-all duration-2000 ease-linear"
              style={{
                left: `${20 + (currentPosition.lat - 28.6) * 2000}%`,
                top: `${40 + Math.sin((currentPosition.lat - 28.6) * 10) * 20}%`,
                transform: 'translate(-50%, -50%)'
              }}
            >
              {/* Train Body */}
              <div className="relative">
                <div className="w-8 h-4 bg-blue-600 rounded-lg shadow-lg border border-blue-700">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-700 rounded-lg"></div>
                  <div className="absolute top-0 left-1 w-1 h-1 bg-yellow-400 rounded-full"></div>
                  <div className="absolute top-0 right-1 w-1 h-1 bg-red-500 rounded-full"></div>
                </div>
                {/* Train Wheels */}
                <div className="absolute -bottom-1 left-1 w-2 h-2 bg-gray-800 rounded-full"></div>
                <div className="absolute -bottom-1 right-1 w-2 h-2 bg-gray-800 rounded-full"></div>
                {/* Motion Lines */}
                <div className="absolute -left-2 top-1 w-3 h-0.5 bg-white opacity-60 animate-pulse"></div>
                <div className="absolute -left-3 top-2 w-2 h-0.5 bg-white opacity-40 animate-pulse"></div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="absolute bottom-4 left-4 right-4 bg-white/90 p-3 rounded-lg shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium">Route Progress</span>
                <span className="text-xs text-muted-foreground">{Math.round(routeProgress * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-1000 ease-linear"
                  style={{ width: `${routeProgress * 100}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>{currentStation}</span>
                <span>{nextStation}</span>
              </div>
            </div>

            <div className="absolute top-4 right-4 bg-white/90 p-2 rounded-lg shadow">
              <div className="text-xs">Live Tracking • {new Date().toLocaleTimeString()}</div>
            </div>
          </div>

          {/* Location Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Current Location</h4>
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <MapPin className="h-3 w-3 text-muted-foreground" />
                  <span>Station: {currentStation}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Coordinates: {currentCoords.lat.toFixed(4)}°, {currentCoords.lng.toFixed(4)}°
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span>ETA: {train.eta || 'Calculating...'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="h-3 w-3 text-muted-foreground" />
                  <span>Status: </span>
                  <Badge variant={train.status === 'on_time' ? 'default' : 'destructive'}>
                    {train.status.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Next Destination</h4>
              <div className="space-y-1 text-xs">
                <div>Station: {nextStation}</div>
                <div>Coordinates: {nextCoords.lat.toFixed(4)}°, {nextCoords.lng.toFixed(4)}°</div>
                <div>Distance: ~{remainingDistance.toFixed(1)} km</div>
                <div>Est. Time: ~{Math.ceil(estimatedTime)} min</div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4 border-t">
            <Button onClick={onClose} className="w-full">
              Close Tracker
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}