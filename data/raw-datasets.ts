// Raw datasets for train traffic controller system
// In production, these would come from actual railway APIs and sensors

export const INDIAN_RAILWAY_STATIONS = [
  {
    id: 'NDLS',
    name: 'New Delhi',
    code: 'NDLS',
    coordinates: { lat: 28.6448, lng: 77.2097 },
    platforms: 16,
    zone: 'Northern Railway',
    division: 'Delhi'
  },
  {
    id: 'GZB',
    name: 'Ghaziabad',
    code: 'GZB',
    coordinates: { lat: 28.6692, lng: 77.4538 },
    platforms: 8,
    zone: 'Northern Railway',
    division: 'Delhi'
  },
  {
    id: 'MB',
    name: 'Moradabad',
    code: 'MB',
    coordinates: { lat: 28.8386, lng: 78.7733 },
    platforms: 6,
    zone: 'Northern Railway',
    division: 'Moradabad'
  },
  {
    id: 'BE',
    name: 'Bareilly',
    code: 'BE',
    coordinates: { lat: 28.3670, lng: 79.4304 },
    platforms: 4,
    zone: 'Northern Railway',
    division: 'Moradabad'
  },
  {
    id: 'LKO',
    name: 'Lucknow',
    code: 'LKO',
    coordinates: { lat: 26.8467, lng: 80.9462 },
    platforms: 6,
    zone: 'Northern Railway',
    division: 'Lucknow'
  }
]

export const TRAIN_SCHEDULES = [
  {
    trainNumber: '12301',
    trainName: 'Rajdhani Express',
    type: 'express',
    weight: 850, // tons
    cost: 95000, // per trip
    route: [
      { stationCode: 'NDLS', arrivalTime: null, departureTime: '16:55', platform: 1 },
      { stationCode: 'GZB', arrivalTime: '17:28', departureTime: '17:30', platform: 2 },
      { stationCode: 'MB', arrivalTime: '19:15', departureTime: '19:17', platform: 1 },
      { stationCode: 'BE', arrivalTime: '20:45', departureTime: '20:47', platform: 3 },
      { stationCode: 'LKO', arrivalTime: '23:30', departureTime: null, platform: 4 }
    ]
  },
  {
    trainNumber: '12002',
    trainName: 'Shatabdi Express',
    type: 'express',
    weight: 720,
    cost: 78000,
    route: [
      { stationCode: 'NDLS', arrivalTime: null, departureTime: '06:00', platform: 3 },
      { stationCode: 'GZB', arrivalTime: '06:33', departureTime: '06:35', platform: 1 },
      { stationCode: 'MB', arrivalTime: '08:20', departureTime: '08:22', platform: 2 },
      { stationCode: 'BE', arrivalTime: '09:50', departureTime: '09:52', platform: 1 },
      { stationCode: 'LKO', arrivalTime: '12:35', departureTime: null, platform: 2 }
    ]
  },
  {
    trainNumber: '22691',
    trainName: 'Rajdhani Express (KTK)',
    type: 'express',
    weight: 800,
    cost: 89000,
    route: [
      { stationCode: 'NDLS', arrivalTime: null, departureTime: '15:50', platform: 2 },
      { stationCode: 'GZB', arrivalTime: '16:23', departureTime: '16:25', platform: 3 }
    ]
  },
  {
    trainNumber: '12259',
    trainName: 'Duronto Express',
    type: 'express',
    weight: 780,
    cost: 82000,
    route: [
      { stationCode: 'NDLS', arrivalTime: null, departureTime: '22:15', platform: 4 },
      { stationCode: 'GZB', arrivalTime: '22:48', departureTime: '22:50', platform: 1 }
    ]
  },
  {
    trainNumber: '12056',
    trainName: 'Jan Shatabdi Express',
    type: 'express',
    weight: 650,
    cost: 65000,
    route: [
      { stationCode: 'NDLS', arrivalTime: null, departureTime: '14:20', platform: 5 },
      { stationCode: 'GZB', arrivalTime: '14:53', departureTime: '14:55', platform: 2 }
    ]
  },
  {
    trainNumber: '12178',
    trainName: 'Intercity Express',
    type: 'express',
    weight: 600,
    cost: 55000,
    route: [
      { stationCode: 'NDLS', arrivalTime: null, departureTime: '07:30', platform: 6 },
      { stationCode: 'GZB', arrivalTime: '08:03', departureTime: '08:05', platform: 4 }
    ]
  },
  {
    trainNumber: '22470',
    trainName: 'Vande Bharat Express',
    type: 'express',
    weight: 430,
    cost: 120000,
    route: [
      { stationCode: 'NDLS', arrivalTime: null, departureTime: '06:30', platform: 7 },
      { stationCode: 'GZB', arrivalTime: '07:03', departureTime: '07:05', platform: 1 }
    ]
  },
  {
    trainNumber: '11234',
    trainName: 'Freight Express',
    type: 'freight',
    weight: 2500,
    cost: 35000,
    route: [
      { stationCode: 'GZB', arrivalTime: null, departureTime: '03:00', platform: 8 },
      { stationCode: 'MB', arrivalTime: '05:30', departureTime: '05:35', platform: 3 },
      { stationCode: 'BE', arrivalTime: '07:45', departureTime: null, platform: 2 }
    ]
  },
  {
    trainNumber: '14556',
    trainName: 'Bareilly Express',
    type: 'express',
    weight: 580,
    cost: 48000,
    route: [
      { stationCode: 'MB', arrivalTime: null, departureTime: '14:30', platform: 1 },
      { stationCode: 'BE', arrivalTime: '16:15', departureTime: '16:17', platform: 3 },
      { stationCode: 'LKO', arrivalTime: '19:45', departureTime: null, platform: 5 }
    ]
  },
  {
    trainNumber: '15708',
    trainName: 'Amrapali Express',
    type: 'express',
    weight: 620,
    cost: 52000,
    route: [
      { stationCode: 'BE', arrivalTime: null, departureTime: '09:20', platform: 2 },
      { stationCode: 'LKO', arrivalTime: '12:30', departureTime: '12:35', platform: 3 },
      { stationCode: 'GZB', arrivalTime: '16:45', departureTime: null, platform: 4 }
    ]
  },
  {
    trainNumber: '12554',
    trainName: 'Vaishali Express',
    type: 'express',
    weight: 680,
    cost: 68000,
    route: [
      { stationCode: 'LKO', arrivalTime: null, departureTime: '05:15', platform: 1 },
      { stationCode: 'BE', arrivalTime: '08:30', departureTime: '08:32', platform: 2 },
      { stationCode: 'MB', arrivalTime: '10:45', departureTime: null, platform: 3 }
    ]
  },
  {
    trainNumber: '12876',
    trainName: 'Neelachal Express',
    type: 'express',
    weight: 640,
    cost: 58000,
    route: [
      { stationCode: 'GZB', arrivalTime: null, departureTime: '13:20', platform: 5 },
      { stationCode: 'MB', arrivalTime: '15:10', departureTime: '15:12', platform: 2 },
      { stationCode: 'LKO', arrivalTime: '18:45', departureTime: null, platform: 4 }
    ]
  }
]

export const REAL_TIME_SENSOR_DATA = {
  trackOccupancy: [
    { sectionId: 'NDLS-GZB-1', occupied: true, trainId: 'T001', timestamp: Date.now() },
    { sectionId: 'GZB-MB-1', occupied: false, trainId: null, timestamp: Date.now() },
    { sectionId: 'MB-BE-1', occupied: true, trainId: 'T002', timestamp: Date.now() }
  ],
  signalStatus: [
    { signalId: 'SIG_NDLS_001', status: 'green', location: 'NDLS', timestamp: Date.now() },
    { signalId: 'SIG_GZB_001', status: 'yellow', location: 'GZB', timestamp: Date.now() },
    { signalId: 'SIG_MB_001', status: 'red', location: 'MB', timestamp: Date.now() }
  ],
  weatherData: [
    { stationId: 'NDLS', temperature: 25, humidity: 60, visibility: 10, rainfall: 0 },
    { stationId: 'GZB', temperature: 24, humidity: 65, visibility: 8, rainfall: 2 },
    { stationId: 'MB', temperature: 23, humidity: 70, visibility: 6, rainfall: 5 }
  ]
}

// Priority calculation based on weight and cost
export function calculateTrainPriority(weight: number, cost: number): number {
  // Higher cost and lower weight = higher priority
  // Vande Bharat: 430 tons, 120000 cost = 12 - 0.43 + 1 = 12.57 → 10 (highest)
  // Freight: 2500 tons, 35000 cost = 3.5 - 2.5 + 1 = 2 (lowest)
  const costFactor = cost / 10000
  const weightPenalty = weight / 1000
  const basePriority = 1
  
  const priority = Math.round(costFactor - weightPenalty + basePriority)
  return Math.max(1, Math.min(10, priority)) // Clamp between 1-10
}

export class DataGenerator {
  static generateTrainPosition(trainId: string, lastPosition: {lat: number, lng: number}, speed: number) {
    const timeStep = 1
    const distance = (speed * timeStep) / 3600
    const bearing = Math.random() * 2 * Math.PI
    const deltaLat = (distance / 111) * Math.cos(bearing)
    const deltaLng = (distance / 111) * Math.sin(bearing)
    
    return {
      lat: lastPosition.lat + deltaLat,
      lng: lastPosition.lng + deltaLng,
      timestamp: Date.now(),
      speed,
      trainId
    }
  }

  static generateDelayFactor() {
    const factors = [
      { type: 'weather', probability: 0.1, impact: 5 },
      { type: 'signal', probability: 0.05, impact: 15 },
      { type: 'passenger', probability: 0.15, impact: 3 },
      { type: 'technical', probability: 0.03, impact: 25 }
    ]
    
    let totalDelay = 0
    factors.forEach(factor => {
      if (Math.random() < factor.probability) {
        totalDelay += factor.impact
      }
    })
    
    return totalDelay
  }
}