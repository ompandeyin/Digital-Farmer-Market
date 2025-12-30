import React from 'react'

const KpiCard = ({ title, value, delta, className }) => {
  return (
    <div className={`bg-white border rounded-lg p-4 flex flex-col justify-between ${className || ''}`}>
      <div className="text-sm text-gray-500">{title}</div>
      <div className="flex items-end justify-between mt-2">
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        {delta !== undefined && (
          <div className={`text-sm font-semibold ${delta >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {delta >= 0 ? `+${delta}%` : `${delta}%`}
          </div>
        )}
      </div>
    </div>
  )
}

export default KpiCard
