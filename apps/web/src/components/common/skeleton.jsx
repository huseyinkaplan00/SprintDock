import React from 'react'

export function Skeleton({ className = '' }) {
  return <div aria-hidden="true" className={`skeleton ${className}`.trim()} />
}
