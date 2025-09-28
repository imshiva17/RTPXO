import { Train, Conflict } from '../types'

export class ConflictDetectionAlgorithm {
  private readonly SAFE_DISTANCE = 2 // km
  private readonly WARNING_DISTANCE = 5 // km

  detectConflicts(trains: Train[]): Conflict[] {
    const conflicts: Conflict[] = []
    
    for (let i = 0; i < trains.length; i++) {
      for (let j = i + 1; j < trains.length; j++) {
        const conflict = this.checkTrainPairConflict(trains[i], trains[j])
        if (conflict) {
          conflicts.push(conflict)
        }
      }
    }
    
    return conflicts
  }

  private checkTrainPairConflict(train1: Train, train2: Train): Conflict | null {
    const distance = this.calculateDistance(train1.coordinates, train2.coordinates)
    
    if (distance < this.WARNING_DISTANCE) {
      const severity = this.calculateSeverity(distance, train1, train2)
      const estimatedDelay = this.estimateDelay(distance, train1, train2)
      
      return {
        id: `conflict_${train1.id}_${train2.id}_${Date.now()}`,
        type: this.determineConflictType(train1, train2),
        trains: [train1.id, train2.id],
        location: train1.currentStation || 'unknown',
        severity,
        estimatedDelay
      }
    }
    
    return null
  }

  private calculateDistance(coord1: {lat: number, lng: number}, coord2: {lat: number, lng: number}): number {
    const R = 6371
    const dLat = (coord2.lat - coord1.lat) * Math.PI / 180
    const dLng = (coord2.lng - coord1.lng) * Math.PI / 180
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(coord1.lat * Math.PI / 180) * Math.cos(coord2.lat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  private calculateSeverity(distance: number, train1: Train, train2: Train): 'low' | 'medium' | 'high' | 'critical' {
    if (distance < 1) return 'critical'
    if (distance < 2) return 'high'
    if (distance < 3) return 'medium'
    return 'low'
  }

  private estimateDelay(distance: number, train1: Train, train2: Train): number {
    const baseDelay = Math.max(0, (this.SAFE_DISTANCE - distance) * 5)
    const priorityFactor = Math.abs(train1.priority - train2.priority) * 0.5
    return Math.floor(baseDelay + priorityFactor)
  }

  private determineConflictType(train1: Train, train2: Train): 'crossing' | 'platform' | 'signal' | 'track' {
    if (train1.currentStation === train2.currentStation) return 'platform'
    return 'crossing'
  }
}