import React, { useEffect, useState } from 'react'
import { orderService, escrowService } from '../services'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { Package, CheckCircle, Clock, XCircle, Gavel, RefreshCw, Lock } from 'lucide-react'

const Orders = () => {
  const navigate = useNavigate()
  const { isAuthenticated, user } = useSelector((state) => state.auth)
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expanded, setExpanded] = useState({})
  const [actionLoading, setActionLoading] = useState({})
  const [successMsg, setSuccessMsg] = useState('')

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false)
      return
    }

    fetchOrders()
  }, [isAuthenticated])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const res = await orderService.getAllOrders()
      setOrders(res.data.data || [])
      setError('')
    } catch (err) {
      console.error('Failed to fetch orders:', err)
      setError(err.response?.data?.message || 'Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  const toggle = (id) => {
    setExpanded((p) => ({ ...p, [id]: !p[id] }))
  }

  const handleConfirmDelivery = async (orderId, orderNumber) => {
    if (!window.confirm(`Confirm that you have received the product for order ${orderNumber}? This will release the payment to the farmer.`)) {
      return
    }
    
    setActionLoading(prev => ({ ...prev, [orderId]: true }))
    try {
      await escrowService.confirmDelivery(orderId)
      setSuccessMsg(`Delivery confirmed for order ${orderNumber}. Payment released to farmer!`)
      fetchOrders()
      setTimeout(() => setSuccessMsg(''), 5000)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to confirm delivery')
    } finally {
      setActionLoading(prev => ({ ...prev, [orderId]: false }))
    }
  }

  const getEscrowBadge = (status) => {
    switch (status) {
      case 'held':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium flex items-center gap-1"><Clock className="w-3 h-3" /> Settlement Held</span>
      case 'released':
        return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Payment Released</span>
      case 'refunded':
        return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium flex items-center gap-1"><XCircle className="w-3 h-3" /> Refunded</span>
      default:
        return null
    }
  }

  if (!isAuthenticated) {
    return (
      <main className="container mx-auto px-4 py-12">
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="w-10 h-10 text-gray-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Please log in</h1>
          <p className="text-gray-600 mb-8">You need to be logged in to view your orders.</p>
          <button
            onClick={() => navigate('/login')}
            className="bg-green-600 text-white px-8 py-3 rounded-xl hover:bg-green-700 transition font-medium"
          >
            Go to Login
          </button>
        </div>
      </main>
    )
  }

  if (loading) return <div className="container mx-auto px-4 py-8">Loading orders...</div>

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">{user && user.role === 'admin' ? 'All Orders' : 'My Orders'}</h1>

      {/* Success Message */}
      {successMsg && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-5 h-5" /> {successMsg}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <XCircle className="w-5 h-5" /> {error}
          <button onClick={() => setError('')} className="ml-auto text-red-500 hover:text-red-700">×</button>
        </div>
      )}

      {orders.length === 0 ? (
        <div className="text-gray-600">{user && user.role === 'admin' ? 'No orders found.' : 'You have no orders yet. Place an order to see it here.'}</div>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => (
            <div key={o._id} className={`bg-white border rounded-lg p-4 ${o.isAuctionOrder ? 'border-l-4 border-l-amber-500' : ''}`}>
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="text-sm text-gray-600">Order #{o.orderNumber}</div>
                    {o.isAuctionOrder && (
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs flex items-center gap-1">
                        <Gavel className="w-3 h-3" /> Auction Order
                      </span>
                    )}
                  </div>
                  <div className="font-semibold text-gray-900">₹{o.totalAmount.toFixed(2)}</div>
                  <div className="text-xs text-gray-500">{new Date(o.createdAt).toLocaleString()}</div>
                  {user && user.role === 'admin' && (
                    <div className="text-sm text-gray-600 mt-1">Buyer: <span className="font-medium">{o.customerName || o.customerEmail || 'Unknown'}</span></div>
                  )}
                </div>

                <div className="text-right">
                  <div className="text-sm">Status: <span className="font-semibold">{o.orderStatus}</span></div>
                  <div className="text-sm">Payment: <span className="font-semibold">{o.paymentStatus}</span></div>
                  {o.isAuctionOrder && o.escrowStatus && (
                    <div className="mt-2">
                      {getEscrowBadge(o.escrowStatus)}
                    </div>
                  )}
                  {o.autoConfirmDate && o.escrowStatus === 'held' && (
                    <div className="text-xs text-gray-500 mt-1">
                      Auto-settlement date: {new Date(o.autoConfirmDate).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>

              {/* Confirm Delivery Button for buyer */}
              {o.isAuctionOrder && o.escrowStatus === 'held' && user?.role !== 'admin' && (
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center justify-between bg-blue-50 p-4 rounded-lg">
                    <div>
                      <p className="font-medium text-blue-900">Have you received this product?</p>
                      <p className="text-sm text-blue-700">Confirming delivery will release payment to the farmer.</p>
                    </div>
                    <button
                      onClick={() => handleConfirmDelivery(o._id, o.orderNumber)}
                      disabled={actionLoading[o._id]}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition"
                    >
                      {actionLoading[o._id] ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle className="w-4 h-4" />
                      )}
                      Confirm Delivery
                    </button>
                  </div>
                </div>
              )}

              <div className="mt-4">
                <button
                  onClick={() => toggle(o._id)}
                  className="text-sm text-green-600 hover:underline"
                >
                  {expanded[o._id] ? 'Hide details' : 'View details'}
                </button>

                {expanded[o._id] && (
                  <div className="mt-4 border-t pt-4">
                    <div className="space-y-2">
                      {o.items.map((it) => (
                        <div key={it.product} className="flex justify-between text-sm">
                          <div>
                            <div className="font-semibold">{it.productName}</div>
                            <div className="text-xs text-gray-500">₹{it.price.toFixed(2)} - {it.quantity} {it.unit || 'units'}</div>
                          </div>
                          <div className="font-semibold">₹{(it.quantity * it.price).toFixed(2)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}

export default Orders
