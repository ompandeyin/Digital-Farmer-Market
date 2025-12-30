import React from 'react'

// Simple SVG line+bar chart using data array of numbers
const PerformanceChart = ({ data = [], height = 80 }) => {
  if (!data || data.length === 0) return null

  const max = Math.max(...data)
  const min = Math.min(...data)
  const padding = 8
  const w = 300
  const h = height
  const step = w / Math.max(1, data.length - 1)

  const points = data.map((d, i) => {
    const x = i * step
    const y = h - padding - ((d - min) / (max - min || 1)) * (h - padding * 2)
    return `${x},${y}`
  })

  const polyline = points.join(' ')

  return (
    <div className="bg-white border rounded-lg p-4">
      <div className="text-sm text-gray-500 mb-2">Performance</div>
      <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h}>
        <polyline points={polyline} fill="none" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {data.map((d, i) => {
          const x = i * step
          const y = h - padding - ((d - min) / (max - min || 1)) * (h - padding * 2)
          return <circle key={i} cx={x} cy={y} r={3} fill="#059669" />
        })}
      </svg>
    </div>
  )
}

export default PerformanceChart
