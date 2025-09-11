import React from 'react'

interface SignalIconProps {
  className?: string
  status?: 'green' | 'yellow' | 'red'
}

export function SignalIcon({ className = "h-6 w-6", status = 'green' }: SignalIconProps) {
  const getSignalColor = () => {
    switch (status) {
      case 'green': return '#10b981'
      case 'yellow': return '#f59e0b'
      case 'red': return '#ef4444'
      default: return '#10b981'
    }
  }

  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      fill="currentColor"
    >
      {/* Signal post */}
      <rect x="45" y="20" width="10" height="70" fill="currentColor" />
      
      {/* Signal base */}
      <rect x="35" y="85" width="30" height="8" rx="2" fill="currentColor" />
      
      {/* Signal box */}
      <rect x="25" y="25" width="50" height="45" rx="5" fill="currentColor" />
      
      {/* Signal lights */}
      <circle cx="50" cy="35" r="6" fill={status === 'red' ? getSignalColor() : '#374151'} opacity={status === 'red' ? 1 : 0.3} />
      <circle cx="50" cy="50" r="6" fill={status === 'yellow' ? getSignalColor() : '#374151'} opacity={status === 'yellow' ? 1 : 0.3} />
      <circle cx="50" cy="65" r="6" fill={status === 'green' ? getSignalColor() : '#374151'} opacity={status === 'green' ? 1 : 0.3} />
      
      {/* Light glow effect for active signal */}
      {status === 'green' && (
        <circle cx="50" cy="65" r="8" fill="#10b981" opacity="0.3" />
      )}
      {status === 'yellow' && (
        <circle cx="50" cy="50" r="8" fill="#f59e0b" opacity="0.3" />
      )}
      {status === 'red' && (
        <circle cx="50" cy="35" r="8" fill="#ef4444" opacity="0.3" />
      )}
    </svg>
  )
}