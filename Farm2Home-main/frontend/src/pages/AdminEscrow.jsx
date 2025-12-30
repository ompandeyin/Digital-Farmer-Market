import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { 
  Wallet, 
  Package, 
  CheckCircle, 
  XCircle, 
  Clock, 
  RefreshCw,
  ArrowRight,
  DollarSign,
  AlertTriangle,
  User,
  Calendar
} from 'lucide-react'
import { escrowService } from '../services'

const AdminEscrow = () => {
  const navigate = useNavigate()
  const { user } = useSelector((state) => state.auth)
  const [summary, setSummary] = useState(null)
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState({})
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [filter, setFilter] = useState('held') // held, released, refunded, all

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchData()
    }
  }, [user, filter])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError('')
      
      const [summaryRes, ordersRes] = await Promise.all([
        escrowService.getEscrowSummary(),
        escrowService.getEscrowOrders({ status: filter === 'all' ? undefined : filter })
      ])
      
      setSummary(summaryRes.data.data)
      setOrders(ordersRes.data.data)
    } catch (err) {
      console.error('Failed to fetch escrow data:', err)
      setError(err.response?.data?.message || 'Failed to load escrow data')
    } finally {
      setLoading(false)
    }
  }

  const handleReleasePayment = async (orderId, orderNumber) => {
    if (!window.confirm(`Release payment for order ${orderNumber} to the farmer?`)) return
    
    setActionLoading(prev => ({ ...prev, [orderId]: 'release' }))
    try {
      await escrowService.releasePayment(orderId)
      setSuccess(`Payment released for order ${orderNumber}`)
      fetchData()
      setTimeout(() => setSuccess(''), 5000)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to release payment')
    } finally {
      setActionLoading(prev => ({ ...prev, [orderId]: null }))
    }
  }

  const handleRefund = async (orderId, orderNumber) => {
    const reason = window.prompt(`Enter reason for refunding order ${orderNumber}:`)
    if (!reason) return
    
    setActionLoading(prev => ({ ...prev, [orderId]: 'refund' }))
    try {
      await escrowService.refundOrder(orderId, reason)
      setSuccess(`Order ${orderNumber} refunded to buyer`)
      fetchData()
      setTimeout(() => setSuccess(''), 5000)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to refund order')
    } finally {
      setActionLoading(prev => ({ ...prev, [orderId]: null }))
    }
  }

  const handleProcessAutoConfirm = async () => {
    if (!window.confirm('Process all overdue auto-confirmations now?')) return
    
    try {
      setLoading(true)
      const res = await escrowService.processAutoConfirmations()
      setSuccess(`Processed ${res.data.data.length} auto-confirmations`)
      fetchData()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to process auto-confirmations')
    } finally {
      setLoading(false)
    }
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-xl shadow-lg">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">Only administrators can access this page.</p>
          <button onClick={() => navigate('/')} className="bg-gray-900 text-white px-4 py-2 rounded-lg">
            Go Home
          </button>
        </div>
      </div>
    )
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'held':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium flex items-center gap-1"><Clock className="w-3 h-3" /> Held in Escrow</span>
      case 'released':
        return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Released</span>
      case 'refunded':
        return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium flex items-center gap-1"><XCircle className="w-3 h-3" /> Refunded</span>
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">{status}</span>
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Wallet className="w-8 h-8 text-indigo-600" />
              Auction Settlement
            </h1>
            <p className="text-gray-600 mt-1">Manage auction settlements and payments</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchData}
              className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg hover:bg-gray-50"
            >
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
            <button
              onClick={handleProcessAutoConfirm}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              <Clock className="w-4 h-4" /> Process Auto-Settlements
            </button>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" /> {error}
            <button onClick={() => setError('')} className="ml-auto text-red-500 hover:text-red-700">×</button>
          </div>
        )}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <CheckCircle className="w-5 h-5" /> {success}
            <button onClick={() => setSuccess('')} className="ml-auto text-green-500 hover:text-green-700">×</button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-xl shadow-sm border">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-3 bg-yellow-100 rounded-lg">
                    <Clock className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
                <p className="text-gray-500 text-sm">Held in Settlement</p>
                <p className="text-2xl font-bold text-gray-900">₹{summary?.totalHeldInEscrow?.toLocaleString() || 0}</p>
                <p className="text-xs text-gray-400">{summary?.pendingOrders || 0} orders pending</p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-3 bg-indigo-100 rounded-lg">
                    <Wallet className="w-6 h-6 text-indigo-600" />
                  </div>
                </div>
                <p className="text-gray-500 text-sm">Settlement Balance</p>
                <p className="text-2xl font-bold text-gray-900">₹{summary?.escrowBalance?.toLocaleString() || 0}</p>
                <p className="text-xs text-gray-400">Admin wallet balance</p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <p className="text-gray-500 text-sm">Released</p>
                <p className="text-2xl font-bold text-gray-900">{summary?.completedOrders || 0}</p>
                <p className="text-xs text-gray-400">Payments released</p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-3 bg-red-100 rounded-lg">
                    <XCircle className="w-6 h-6 text-red-600" />
                  </div>
                </div>
                <p className="text-gray-500 text-sm">Refunded</p>
                <p className="text-2xl font-bold text-gray-900">{summary?.refundedOrders || 0}</p>
                <p className="text-xs text-gray-400">Orders refunded</p>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 mb-6">
              {['held', 'released', 'refunded', 'all'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    filter === f
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white border text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {f === 'held' && <Clock className="w-4 h-4 inline mr-1" />}
                  {f === 'released' && <CheckCircle className="w-4 h-4 inline mr-1" />}
                  {f === 'refunded' && <XCircle className="w-4 h-4 inline mr-1" />}
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="px-6 py-4 border-b bg-gray-50">
                <h2 className="text-lg font-semibold text-gray-900">Auction Orders</h2>
              </div>

              {orders.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                  <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No {filter === 'all' ? '' : filter} orders found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Buyer</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Auto-Confirm</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {orders.map((order) => (
                        <tr key={order._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900">{order.orderNumber}</div>
                            <div className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-gray-400" />
                              <div>
                                <div className="text-sm font-medium text-gray-900">{order.customer?.fullName || order.customerName}</div>
                                <div className="text-xs text-gray-500">{order.customer?.email || order.customerEmail}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              {order.items[0]?.productImage && (
                                <img src={order.items[0].productImage} alt="" className="w-10 h-10 rounded object-cover" />
                              )}
                              <div>
                                <div className="text-sm font-medium text-gray-900">{order.items[0]?.productName}</div>
                                <div className="text-xs text-gray-500">Farmer: {order.items[0]?.farmerName}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-bold text-green-600">₹{order.escrowAmount || order.totalAmount}</div>
                          </td>
                          <td className="px-6 py-4">
                            {getStatusBadge(order.escrowStatus)}
                          </td>
                          <td className="px-6 py-4">
                            {order.autoConfirmDate ? (
                              <div className="text-xs text-gray-500 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(order.autoConfirmDate).toLocaleDateString()}
                              </div>
                            ) : '-'}
                          </td>
                          <td className="px-6 py-4">
                            {order.escrowStatus === 'held' && (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleReleasePayment(order._id, order.orderNumber)}
                                  disabled={actionLoading[order._id]}
                                  className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 disabled:opacity-50"
                                >
                                  {actionLoading[order._id] === 'release' ? (
                                    <RefreshCw className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <CheckCircle className="w-3 h-3" />
                                  )}
                                  Release
                                </button>
                                <button
                                  onClick={() => handleRefund(order._id, order.orderNumber)}
                                  disabled={actionLoading[order._id]}
                                  className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 disabled:opacity-50"
                                >
                                  {actionLoading[order._id] === 'refund' ? (
                                    <RefreshCw className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <XCircle className="w-3 h-3" />
                                  )}
                                  Refund
                                </button>
                              </div>
                            )}
                            {order.escrowStatus === 'released' && (
                              <span className="text-xs text-green-600">Paid to farmer</span>
                            )}
                            {order.escrowStatus === 'refunded' && (
                              <span className="text-xs text-red-600">Refunded to buyer</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Info Box */}
            <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">How Auction Settlement Works</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-blue-800">
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-blue-700 font-bold text-xs">1</div>
                  <div>
                    <p className="font-medium">Auction Ends</p>
                    <p className="text-blue-600">Winner's wallet is debited, funds held for settlement</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-blue-700 font-bold text-xs">2</div>
                  <div>
                    <p className="font-medium">Delivery Confirmed</p>
                    <p className="text-blue-600">Buyer confirms receipt OR auto-settles after 7 days</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-blue-700 font-bold text-xs">3</div>
                  <div>
                    <p className="font-medium">Payment Released</p>
                    <p className="text-blue-600">Admin releases settlement to farmer's wallet</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default AdminEscrow
