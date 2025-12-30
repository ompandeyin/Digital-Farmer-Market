import React from 'react'

const RecentOrders = ({ orders = [] }) => {
  return (
    <div className="bg-white border rounded-lg p-4 overflow-auto">
      <div className="text-sm text-gray-500 mb-2">Recent Orders</div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-500 text-xs border-b">
            <th className="py-2">Order</th>
            <th className="py-2">Buyer</th>
            <th className="py-2">Amount</th>
            <th className="py-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {orders.length === 0 && (
            <tr>
              <td colSpan="4" className="py-3 text-gray-500">No recent orders</td>
            </tr>
          )}
          {orders.map((o) => (
            <tr key={o._id} className="border-b hover:bg-gray-50">
              <td className="py-3">#{o._id.slice(-6)} • {o.createdAt}</td>
              <td className="py-3">{o.buyer}</td>
              <td className="py-3">₹{o.amount}</td>
              <td className={`py-3 font-semibold ${o.status === 'completed' ? 'text-green-600' : 'text-yellow-600'}`}>{o.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default RecentOrders
