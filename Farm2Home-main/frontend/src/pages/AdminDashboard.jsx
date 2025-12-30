
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Users, 
  ShoppingBag, 
  Gavel, 
  TrendingUp, 
  DollarSign, 
  Package, 
  ArrowRight, 
  Activity, 
  LogOut,
  Search,
  Bell,
  Wallet
} from 'lucide-react'
import KpiCard from '../components/dashboard/KpiCard'
import PerformanceChart from '../components/dashboard/PerformanceChart'
import RecentOrders from '../components/dashboard/RecentOrders'
import { adminService } from '../services'

const AdminDashboard = () => {
  const navigate = useNavigate()
  const { user } = useSelector((state) => state.auth)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true)
        const res = await adminService.getDashboard()
        setData(res.data.data)
      } catch (err) {
        console.error('Failed to load admin dashboard', err)
        setError(err.response?.data?.message || 'Failed to load dashboard')
      } finally {
        setLoading(false)
      }
    }
    if (user && user.role === 'admin') fetch()
  }, [user])

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-xl shadow-lg max-w-md w-full">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <LogOut className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-6">You must be an administrator to view this dashboard.</p>
          <button 
            onClick={() => navigate('/')}
            className="w-full bg-gray-900 text-white py-2 px-4 rounded-lg hover:bg-gray-800 transition-colors"
          >
            Return Home
          </button>
        </div>
      </div>
    )
  }

  const StatCard = ({ title, value, icon: Icon, trend, color }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {trend && (
          <div className="flex items-center text-green-600 text-sm font-medium bg-green-50 px-2 py-1 rounded-full">
            <TrendingUp className="w-3 h-3 mr-1" />
            {trend}
          </div>
        )}
      </div>
      <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
      <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <LayoutDashboard className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">AdminPanel</span>
            </div>

            <div className="flex-1 flex justify-center px-8">
              <div className="relative max-w-md w-full hidden md:block">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:bg-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition duration-150 ease-in-out"
                  placeholder="Search orders, users, or auctions..."
                />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button className="p-2 rounded-full text-gray-400 hover:text-gray-500 hover:bg-gray-100 relative">
                <Bell className="w-6 h-6" />
                <span className="absolute top-2 right-2 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
              </button>
              <div className="flex items-center space-x-3 pl-4 border-l border-gray-200">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                  {user.fullName?.[0]}
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-gray-900">{user.fullName}</p>
                  <p className="text-xs text-gray-500">{user.role}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Dashboard Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard 
                title="Total Revenue" 
                value={data?.kpis?.totalRevenue ? `₹${data.kpis.totalRevenue.toLocaleString()}` : '₹0'} 
                icon={DollarSign}
                color="bg-emerald-500"
                trend="12.5%"
              />
              <StatCard 
                title="Total Orders" 
                value={data?.kpis?.totalOrders ?? '0'} 
                icon={ShoppingBag}
                color="bg-blue-500"
                trend="8.2%"
              />
              <StatCard 
                title="Active Auctions" 
                value={data?.kpis?.activeAuctions ?? '0'} 
                icon={Gavel}
                color="bg-amber-500"
              />
              <StatCard 
                title="New Users" 
                value={data?.kpis?.newUsers ?? '0'} 
                icon={Users}
                color="bg-purple-500"
                trend="2.4%"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Chart Area */}
              <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-gray-900">Revenue Overview</h2>
                  <select className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2">
                    <option>Last 12 Months</option>
                  </select>
                </div>
                <div className="h-80">
                  <PerformanceChart data={(data.performance || []).map((m) => m.revenue || 0)} height={320} />
                </div>
              </div>

              {/* Quick Actions & Top Sellers */}
              <div className="space-y-6">
                {/* Quick Actions */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => navigate('/admin/settlement')} className="flex flex-col items-center justify-center p-4 bg-green-50 rounded-xl hover:bg-green-100 transition-colors group">
                      <Wallet className="w-6 h-6 text-green-600 mb-2 group-hover:scale-110 transition-transform" />
                      <span className="text-sm font-medium text-green-900">Auction Settlement</span>
                    </button>
                    <button onClick={() => navigate('/auctions')} className="flex flex-col items-center justify-center p-4 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-colors group">
                      <Gavel className="w-6 h-6 text-indigo-600 mb-2 group-hover:scale-110 transition-transform" />
                      <span className="text-sm font-medium text-indigo-900">Auctions</span>
                    </button>
                    <button onClick={() => navigate('/admin/users')} className="flex flex-col items-center justify-center p-4 bg-pink-50 rounded-xl hover:bg-pink-100 transition-colors group">
                      <Users className="w-6 h-6 text-pink-600 mb-2 group-hover:scale-110 transition-transform" />
                      <span className="text-sm font-medium text-pink-900">Users</span>
                    </button>
                    <button onClick={() => navigate('/orders')} className="flex flex-col items-center justify-center p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors group">
                      <ShoppingBag className="w-6 h-6 text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
                      <span className="text-sm font-medium text-blue-900">Orders</span>
                    </button>
                    <button onClick={() => navigate('/admin/requests')} className="flex flex-col items-center justify-center p-4 bg-amber-50 rounded-xl hover:bg-amber-100 transition-colors group">
                      <Activity className="w-6 h-6 text-amber-600 mb-2 group-hover:scale-110 transition-transform" />
                      <span className="text-sm font-medium text-amber-900">Requests</span>
                    </button>
                  </div>
                </div>

                {/* Top Sellers */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <h2 className="text-lg font-bold text-gray-900 mb-4">Top Sellers</h2>
                  <div className="space-y-4">
                    {(data.topSellers || []).map((s, i) => (
                      <div key={s.farmerId || i} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                            i === 0 ? 'bg-yellow-100 text-yellow-700' :
                            i === 1 ? 'bg-gray-100 text-gray-700' :
                            i === 2 ? 'bg-orange-100 text-orange-700' :
                            'bg-blue-50 text-blue-600'
                          }`}>
                            {i + 1}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{s.farmerName || 'Unknown Farmer'}</p>
                            <p className="text-xs text-gray-500">{s.orders || 0} orders</p>
                          </div>
                        </div>
                        <span className="text-sm font-bold text-gray-900">₹{(s.revenue || 0).toLocaleString()}</span>
                      </div>
                    ))}
                    {(!data.topSellers || data.topSellers.length === 0) && (
                      <p className="text-sm text-gray-500 text-center py-4">No sales data yet</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Orders Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900">Recent Orders</h2>
                <button onClick={() => navigate('/orders')} className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center">
                  View All <ArrowRight className="w-4 h-4 ml-1" />
                </button>
              </div>
              <div className="overflow-x-auto">
                <RecentOrders orders={(data.recentOrders || []).map(o => ({
                  _id: o.orderNumber,
                  buyer: o.customerName || 'Unknown',
                  amount: o.totalAmount,
                  status: o.orderStatus,
                  createdAt: new Date(o.createdAt).toLocaleDateString()
                }))} />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default AdminDashboard
