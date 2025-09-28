import { realTimeEngine } from './real-time-engine'

// Initialize the real-time engine when the application starts
export function initializeSystem() {
  console.log('🚂 Initializing Train Traffic Controller System...')
  
  // Start the real-time engine
  realTimeEngine.start()
  
  // Set up event listeners
  realTimeEngine.on('system:started', () => {
    console.log('✅ Real-time engine started successfully')
  })
  
  realTimeEngine.on('data:updated', (data) => {
    console.log(`📊 System update: ${data.trains.length} trains, ${data.conflicts.length} conflicts`)
  })
  
  realTimeEngine.on('train:updated', (train) => {
    console.log(`🚆 Train ${train.id} updated: ${train.status}`)
  })
  
  console.log('🎯 System initialization complete')
}

// Cleanup function for graceful shutdown
export function shutdownSystem() {
  console.log('🛑 Shutting down Train Traffic Controller System...')
  realTimeEngine.stop()
  console.log('✅ System shutdown complete')
}

// Auto-initialize if this is the main module
if (typeof window !== 'undefined') {
  // Browser environment - initialize on load
  window.addEventListener('load', initializeSystem)
  window.addEventListener('beforeunload', shutdownSystem)
} else {
  // Node.js environment - initialize immediately
  initializeSystem()
}