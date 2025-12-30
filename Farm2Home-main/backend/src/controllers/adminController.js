import Order from '../models/Order.js'
import User from '../models/User.js'
import Auction from '../models/Auction.js'

// GET /api/v1/admin/dashboard
export const getDashboard = async (req, res) => {
  try {
    // Basic KPIs
    const totalOrders = await Order.countDocuments()

    const revenueAgg = await Order.aggregate([
      { $match: { paymentStatus: 'completed' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ])
    const totalRevenue = (revenueAgg[0] && revenueAgg[0].total) || 0

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const newUsers = await User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } })

    const activeAuctions = await Auction.countDocuments({ status: 'live' })

    // Performance: monthly orders for last 12 months
    const twelveMonthsAgo = new Date()
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11)
    twelveMonthsAgo.setDate(1)
    twelveMonthsAgo.setHours(0,0,0,0)

    const perfAgg = await Order.aggregate([
      { $match: { createdAt: { $gte: twelveMonthsAgo }, paymentStatus: 'completed' } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          count: { $sum: 1 },
          revenue: { $sum: '$totalAmount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ])

    // Format to months array
    const months = []
    const now = new Date()
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1)
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`
      months.push({ key, label: d.toLocaleString('default', { month: 'short', year: 'numeric' }), orders: 0, revenue: 0 })
    }

    perfAgg.forEach((p) => {
      const key = `${p._id.year}-${p._id.month}`
      const m = months.find((x) => x.key === key)
      if (m) {
        m.orders = p.count
        m.revenue = p.revenue
      }
    })

    // Recent orders
    const recentOrders = await Order.find().sort({ createdAt: -1 }).limit(6).select('orderNumber customerName totalAmount orderStatus createdAt').lean()

    // Top sellers - aggregate items by farmer
    const topSellersAgg = await Order.aggregate([
      { $unwind: '$items' },
      { $group: { _id: '$items.farmer', orders: { $sum: 1 }, revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } } } },
      { $sort: { revenue: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'farmer' } },
      { $unwind: { path: '$farmer', preserveNullAndEmptyArrays: true } },
      { $project: { _id: 0, farmerId: '$_id', farmerName: '$farmer.fullName', orders: 1, revenue: 1 } }
    ])

    res.status(200).json({
      success: true,
      data: {
        kpis: {
          totalOrders,
          totalRevenue,
          newUsers,
          activeAuctions
        },
        performance: months,
        recentOrders,
        topSellers: topSellersAgg
      }
    })
  } catch (error) {
    console.error('Admin dashboard error:', error)
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch dashboard' })
  }
}
