import React from 'react'

interface TrainLogoProps {
  className?: string
}

export function TrainLogo({ className = "h-8 w-8" }: TrainLogoProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      fill="currentColor"
    >
      {/* Train body */}
      <rect x="15" y="35" width="70" height="30" rx="8" fill="currentColor" />
      
      {/* Train front */}
      <path d="M15 50 L5 40 L5 60 Z" fill="currentColor" />
      
      {/* Windows */}
      <rect x="22" y="42" width="12" height="8" rx="2" fill="white" opacity="0.9" />
      <rect x="38" y="42" width="12" height="8" rx="2" fill="white" opacity="0.9" />
      <rect x="54" y="42" width="12" height="8" rx="2" fill="white" opacity="0.9" />
      <rect x="70" y="42" width="8" height="8" rx="2" fill="white" opacity="0.9" />
      
      {/* Wheels */}
      <circle cx="25" cy="70" r="6" fill="currentColor" />
      <circle cx="45" cy="70" r="6" fill="currentColor" />
      <circle cx="65" cy="70" r="6" fill="currentColor" />
      
      {/* Wheel details */}
      <circle cx="25" cy="70" r="3" fill="white" opacity="0.8" />
      <circle cx="45" cy="70" r="3" fill="white" opacity="0.8" />
      <circle cx="65" cy="70" r="3" fill="white" opacity="0.8" />
      
      {/* Railway track */}
      <rect x="0" y="78" width="100" height="2" fill="currentColor" opacity="0.6" />
      <rect x="0" y="82" width="100" height="2" fill="currentColor" opacity="0.6" />
      
      {/* Track ties */}
      <rect x="10" y="76" width="2" height="8" fill="currentColor" opacity="0.4" />
      <rect x="25" y="76" width="2" height="8" fill="currentColor" opacity="0.4" />
      <rect x="40" y="76" width="2" height="8" fill="currentColor" opacity="0.4" />
      <rect x="55" y="76" width="2" height="8" fill="currentColor" opacity="0.4" />
      <rect x="70" y="76" width="2" height="8" fill="currentColor" opacity="0.4" />
      <rect x="85" y="76" width="2" height="8" fill="currentColor" opacity="0.4" />
    </svg>
  )
}