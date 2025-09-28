import { Train, Station, Signal, Conflict, AIRecommendation, KPI } from './types'
import { TRAIN_SCHEDULES, INDIAN_RAILWAY_STATIONS, calculateTrainPriority } from '../data/raw-datasets'
import { EventEmitter } from 'events'

export class RealTimeEngine extends EventEmitter {
  private trains: Map<string, Train> = new Map()
  private stations: Map<string, Station> = new Map()
  private signals: Map<string, Signal> = new Map()
  private conflicts: Map<string, Conflict> = new Map()
  private trainRouteProgress: Map<string, number> = new Map() // Track route progress for each train
  private updateInterval: NodeJS.Timeout | null = null
  private isRunning = false

  constructor() {
    super()
    this.initializeSystem()
  }

  start() {
    if (this.isRunning) return
    this.isRunning = true
    this.updateInterval = setInterval(() => {
      this.processRealTimeUpdates()
    }, 1000) // Update every second
    this.emit('system:started')
  }

  stop() {
    if (!this.isRunning) return
    this.isRunning = false
    if (this.updateInterval) {
      clearInterval(this.updateInterval)
      this.updateInterval = null
    }
    this.emit('system:stopped')
  }

  private initializeSystem() {
    // Initialize with sample data
    this.loadInitialData()
  }

  private processRealTimeUpdates() {
    // Update train positions
    this.updateTrainPositions()
    
    // Detect conflicts
    this.detectConflicts()
    
    // Generate AI recommendations
    this.generateRecommendations()
    
    // Calculate KPIs
    const kpis = this.calculateKPIs()
    
    // Emit updates
    this.emit('data:updated', {
      trains: Array.from(this.trains.values()),
      signals: Array.from(this.signals.values()),
      conflicts: Array.from(this.conflicts.values()),
      kpis
    })
  }

  private updateTrainPositions() {
    this.trains.forEach(train => {
      // Get train's route from schedule
      const schedule = TRAIN_SCHEDULES.find(s => s.trainNumber === train.number)
      if (!schedule) return
      
      // Get or initialize route progress for this train
      let routeProgress = this.trainRouteProgress.get(train.id)
      if (routeProgress === undefined) {
        // Initialize with different starting positions based on train number
        const trainNum = parseInt(train.number) || 1
        const hash = trainNum * 2654435761 % 2147483647 // Hash function for distribution
        routeProgress = (hash / 2147483647) * (schedule.route.length - 1)
        this.trainRouteProgress.set(train.id, routeProgress)
      }
      
      // Update progress based on speed
      const speedKmh = train.speed || 60
      const progressIncrement = (speedKmh * 0.0002) / 60
      routeProgress = Math.min(schedule.route.length - 1, routeProgress + progressIncrement)
      this.trainRouteProgress.set(train.id, routeProgress)
      
      // Determine current station index and progress within segment
      const currentStationIndex = Math.floor(routeProgress)
      const segmentProgress = routeProgress - currentStationIndex
      
      const currentRouteStop = schedule.route[currentStationIndex]
      const nextRouteStop = schedule.route[Math.min(currentStationIndex + 1, schedule.route.length - 1)]
      
      if (currentRouteStop && nextRouteStop) {
        const currentStation = INDIAN_RAILWAY_STATIONS.find(s => s.code === currentRouteStop.stationCode)
        const nextStation = INDIAN_RAILWAY_STATIONS.find(s => s.code === nextRouteStop.stationCode)
        
        if (currentStation && nextStation) {
          // Use segment progress for interpolation
          const progress = segmentProgress
          
          // Interpolate coordinates between current and next station
          const latDiff = nextStation.coordinates.lat - currentStation.coordinates.lat
          const lngDiff = nextStation.coordinates.lng - currentStation.coordinates.lng
          
          train.coordinates = {
            lat: currentStation.coordinates.lat + (latDiff * progress),
            lng: currentStation.coordinates.lng + (lngDiff * progress)
          }
          
          // Update position for compatibility
          train.position = {
            x: train.coordinates.lng,
            y: train.coordinates.lat
          }
          
          // Update current and next station names based on progress
          if (segmentProgress < 0.1) {
            // At current station
            train.currentStation = currentStation.name
            train.nextStation = nextStation.name
          } else if (segmentProgress > 0.9 && currentStationIndex < schedule.route.length - 2) {
            // Approaching next station
            train.currentStation = nextStation.name
            const afterNext = schedule.route[currentStationIndex + 2]
            const afterNextStation = INDIAN_RAILWAY_STATIONS.find(s => s.code === afterNext?.stationCode)
            train.nextStation = afterNextStation?.name || 'Destination'
          } else {
            // In transit between stations
            if (train.number === '22470') {
              train.currentStation = 'In Transit'
            } else {
              train.currentStation = `En route to ${nextStation.name}`
            }
            train.nextStation = nextStation.name
          }
        } else {
          // Fallback to first station coordinates if no match found
          const firstStation = INDIAN_RAILWAY_STATIONS.find(s => s.code === schedule.route[0]?.stationCode)
          if (firstStation) {
            train.coordinates = {
              lat: firstStation.coordinates.lat,
              lng: firstStation.coordinates.lng
            }
            train.position = {
              x: firstStation.coordinates.lng,
              y: firstStation.coordinates.lat
            }
          }
        }
      }
      
      // Simulate speed variation
      const speedVariation = (Math.random() - 0.5) * 5
      train.speed = Math.max(40, Math.min(120, train.speed + speedVariation))
      
      // Update delay
      if (Math.random() < 0.1) {
        train.delay += Math.floor((Math.random() - 0.5) * 3)
        train.delay = Math.max(0, train.delay)
      }
      
      // Update status
      train.status = train.delay > 10 ? 'delayed' : 'on_time'
    })
  }

  private detectConflicts() {
    const trains = Array.from(this.trains.values())
    
    // Clear existing conflicts
    this.conflicts.clear()
    
    // Check for potential conflicts
    for (let i = 0; i < trains.length; i++) {
      for (let j = i + 1; j < trains.length; j++) {
        const train1 = trains[i]
        const train2 = trains[j]
        
        // Calculate distance between trains
        const distance = this.calculateDistance(
          train1.coordinates,
          train2.coordinates
        )
        
        // If trains are too close, create conflict
        if (distance < 5) { // 5km threshold
          const conflict: Conflict = {
            id: `conflict_${train1.id}_${train2.id}`,
            type: 'crossing',
            trains: [train1.id, train2.id],
            location: train1.currentStation || 'unknown',
            severity: distance < 2 ? 'critical' : distance < 3 ? 'high' : 'medium',
            estimatedDelay: Math.floor(distance * 2)
          }
          
          this.conflicts.set(conflict.id, conflict)
        }
      }
    }
  }

  private generateRecommendations() {
    this.conflicts.forEach(conflict => {
      if (!conflict.aiRecommendation) {
        const recommendation = this.createAIRecommendation(conflict)
        conflict.aiRecommendation = recommendation
      }
    })
  }

  private createAIRecommendation(conflict: Conflict): AIRecommendation {
    const trains = conflict.trains.map(id => this.trains.get(id)!).filter(Boolean)
    
    // Simple AI logic - prioritize based on train priority and delay
    const highestPriorityTrain = trains.reduce((prev, current) => 
      prev.priority > current.priority ? prev : current
    )
    
    const actionType = conflict.severity === 'critical' ? 'hold' : 'proceed'
    const targetTrain = trains.find(t => t.id !== highestPriorityTrain.id)?.id || trains[0].id
    
    return {
      id: `rec_${conflict.id}`,
      conflictId: conflict.id,
      type: actionType,
      targetTrain,
      action: `${actionType === 'hold' ? 'Hold' : 'Proceed with caution'} train ${targetTrain}`,
      reasoning: `Based on priority analysis and current delays`,
      confidence: 0.85,
      estimatedImpact: {
        delayReduction: Math.floor(conflict.estimatedDelay * 0.6),
        affectedTrains: conflict.trains
      },
      timestamp: new Date().toISOString()
    }
  }

  private calculateDistance(coord1: {lat: number, lng: number}, coord2: {lat: number, lng: number}): number {
    const R = 6371 // Earth's radius in km
    const dLat = (coord2.lat - coord1.lat) * Math.PI / 180
    const dLng = (coord2.lng - coord1.lng) * Math.PI / 180
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(coord1.lat * Math.PI / 180) * Math.cos(coord2.lat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  private calculateKPIs(): KPI {
    const trains = Array.from(this.trains.values())
    const onTimeTrains = trains.filter(t => t.delay <= 5).length
    const totalDelays = trains.reduce((sum, t) => sum + t.delay, 0)
    
    return {
      punctuality: (onTimeTrains / trains.length) * 100,
      averageDelay: totalDelays / trains.length,
      throughput: trains.length,
      conflictsResolved: this.conflicts.size,
      aiAcceptanceRate: 85 // Mock value
    }
  }

  private loadInitialData() {
    // Load trains from TRAIN_SCHEDULES with unique positions
    const trains: Train[] = TRAIN_SCHEDULES.map((schedule, index) => {
      // Each train starts at different position based on train number
      const trainNum = parseInt(schedule.trainNumber) || (index + 1)
      const hash = trainNum * 2654435761 % 2147483647
      const routePosition = hash / 2147483647
      const currentStationIndex = Math.floor(routePosition * (schedule.route.length - 1))
      
      const currentStationCode = schedule.route[currentStationIndex]?.stationCode || schedule.route[0]?.stationCode || 'NDLS'
      const nextStationCode = schedule.route[Math.min(currentStationIndex + 1, schedule.route.length - 1)]?.stationCode || 'GZB'
      const currentStation = INDIAN_RAILWAY_STATIONS.find(s => s.code === currentStationCode)
      const nextStation = INDIAN_RAILWAY_STATIONS.find(s => s.code === nextStationCode)
      
      return {
        id: `T${String(index + 1).padStart(3, '0')}`,
        number: schedule.trainNumber,
        name: schedule.trainName,
        type: schedule.type,
        priority: calculateTrainPriority(schedule.weight || 600, schedule.cost || 50000),
        currentStation: currentStation?.name || 'Unknown',
        nextStation: nextStation?.name || 'Unknown',
        status: Math.random() > 0.7 ? 'delayed' : 'on_time',
        delay: Math.random() > 0.7 ? Math.floor(Math.random() * 30) : 0,
        speed: schedule.trainNumber === '22470' ? 90 : Math.floor(Math.random() * 40 + 80), // Vande Bharat: 90 km/h, others: 80-120 km/h
        coordinates: {
          lat: currentStation?.coordinates.lat || 28.6448,
          lng: currentStation?.coordinates.lng || 77.2097
        },
        schedule: schedule.route,
        route: `${currentStation?.name || 'Unknown'} → ${nextStation?.name || 'Unknown'}`,
        eta: `${Math.floor(Math.random() * 45 + 15)} min`,
        position: {
          x: currentStation?.coordinates.lng || 77.2097,
          y: currentStation?.coordinates.lat || 28.6448
        }
      }
    })

    trains.forEach(train => this.trains.set(train.id, train))
    
    // Load stations
    INDIAN_RAILWAY_STATIONS.forEach(station => {
      this.stations.set(station.id, {
        id: station.id,
        name: station.name,
        code: station.code,
        coordinates: station.coordinates,
        platforms: station.platforms,
        zone: station.zone,
        division: station.division
      })
    })
  }

  // Public methods for external control
  updateTrain(trainId: string, updates: Partial<Train>) {
    const train = this.trains.get(trainId)
    if (train) {
      Object.assign(train, updates)
      this.emit('train:updated', train)
    }
  }

  getSystemState() {
    return {
      trains: Array.from(this.trains.values()),
      stations: Array.from(this.stations.values()),
      signals: Array.from(this.signals.values()),
      conflicts: Array.from(this.conflicts.values()),
      isRunning: this.isRunning
    }
  }
}

export const realTimeEngine = new RealTimeEngine()