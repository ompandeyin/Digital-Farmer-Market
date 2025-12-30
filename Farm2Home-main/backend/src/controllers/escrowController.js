/**
 * Escrow Controller
 * Handles delivery confirmation, payment release, refunds, and escrow management
 */

import Order from '../models/Order.js'
import Auction from '../models/Auction.js'
import escrowService from '../services/escrowService.js'

/**
 * Buyer confirms delivery of an auction order
 * POST /api/escrow/confirm-delivery/:orderId
 */
export const confirmDelivery = async (req, res) => {
  try {
    const { orderId } = req.params
    const userId = req.user._id
    const userRole = req.user.role
    
    const result = await escrowService.confirmDeliveryAndRelease(orderId, userId, userRole)
    
    res.status(200).json({
      success: true,
      message: result.message,
      data: result.data
    })
  } catch (error) {
    console.error('Confirm delivery error:', error)
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to confirm delivery'
    })
  }
}

/**
 * Admin releases payment to farmer (after delivery confirmation)
 * POST /api/escrow/release-payment/:orderId
 */
export const releasePayment = async (req, res) => {
  try {
    const { orderId } = req.params
    const adminId = req.user._id
    
    // This will confirm delivery and release payment
    const result = await escrowService.confirmDeliveryAndRelease(orderId, adminId, 'admin')
    
    res.status(200).json({
      success: true,
      message: 'Payment released to farmer successfully',
      data: result.data
    })
  } catch (error) {
    console.error('Release payment error:', error)
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to release payment'
    })
  }
}

/**
 * Admin refunds escrow back to buyer
 * POST /api/escrow/refund/:orderId
 */
export const refundOrder = async (req, res) => {
  try {
    const { orderId } = req.params
    const { reason } = req.body
    const adminId = req.user._id
    
    const result = await escrowService.refundEscrow(orderId, adminId, reason || 'Admin initiated refund')
    
    res.status(200).json({
      success: true,
      message: result.message,
      data: result.data
    })
  } catch (error) {
    console.error('Refund error:', error)
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to process refund'
    })
  }
}

/**
 * Get escrow summary for admin dashboard
 * GET /api/escrow/summary
 */
export const getEscrowSummary = async (req, res) => {
  try {
    const summary = await escrowService.getEscrowSummary()
    
    res.status(200).json({
      success: true,
      data: summary
    })
  } catch (error) {
    console.error('Get escrow summary error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get escrow summary'
    })
  }
}

/**
 * Get all auction orders with escrow status (admin)
 * GET /api/escrow/orders
 */
export const getEscrowOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query
    const skip = (parseInt(page) - 1) * parseInt(limit)
    
    const query = { isAuctionOrder: true }
    if (status) {
      query.escrowStatus = status
    }
    
    const orders = await Order.find(query)
      .populate('customer', 'fullName email phone')
      .populate('auctionId', 'productName productImage farmer farmerName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
    
    const total = await Order.countDocuments(query)
    
    res.status(200).json({
      success: true,
      data: orders,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    })
  } catch (error) {
    console.error('Get escrow orders error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get escrow orders'
    })
  }
}

/**
 * Get single auction order details with escrow info
 * GET /api/escrow/orders/:orderId
 */
export const getEscrowOrderDetails = async (req, res) => {
  try {
    const { orderId } = req.params
    
    const order = await Order.findById(orderId)
      .populate('customer', 'fullName email phone address')
      .populate('auctionId', 'productName productImage farmer farmerName currentPrice totalBids')
      .populate('deliveryConfirmedBy', 'fullName')
      .populate('refundedBy', 'fullName')
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      })
    }
    
    // Check access: buyer, farmer, or admin
    const isBuyer = order.customer._id.toString() === req.user._id.toString()
    const isFarmer = order.items[0]?.farmer?.toString() === req.user._id.toString()
    const isAdmin = req.user.role === 'admin'
    
    if (!isBuyer && !isFarmer && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this order'
      })
    }
    
    res.status(200).json({
      success: true,
      data: order
    })
  } catch (error) {
    console.error('Get escrow order details error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get order details'
    })
  }
}

/**
 * Retry settlement for a failed auction
 * POST /api/escrow/retry-settlement/:auctionId
 */
export const retrySettlement = async (req, res) => {
  try {
    const { auctionId } = req.params
    
    const auction = await Auction.findById(auctionId)
    if (!auction) {
      return res.status(404).json({
        success: false,
        message: 'Auction not found'
      })
    }
    
    // Only allow retry for failed settlements
    if (auction.settlementStatus !== 'failed_insufficient_funds' && auction.settlementStatus !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot retry settlement for auction with status: ${auction.settlementStatus}`
      })
    }
    
    // Reset settlement status to allow retry
    auction.settlementStatus = 'pending'
    await auction.save()
    
    const result = await escrowService.settleAuctionEnd(auctionId)
    
    res.status(200).json({
      success: true,
      message: 'Settlement retry successful',
      data: result.data
    })
  } catch (error) {
    console.error('Retry settlement error:', error)
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to retry settlement'
    })
  }
}

/**
 * Manually trigger auto-confirmations (admin cron endpoint)
 * POST /api/escrow/process-auto-confirmations
 */
export const processAutoConfirmations = async (req, res) => {
  try {
    const results = await escrowService.processAutoConfirmations()
    
    res.status(200).json({
      success: true,
      message: `Processed ${results.length} auto-confirmations`,
      data: results
    })
  } catch (error) {
    console.error('Auto-confirmation error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to process auto-confirmations'
    })
  }
}

/**
 * Get buyer's auction orders with escrow status
 * GET /api/escrow/my-orders
 */
export const getMyAuctionOrders = async (req, res) => {
  try {
    const userId = req.user._id
    
    const orders = await Order.find({
      customer: userId,
      isAuctionOrder: true
    })
      .populate('auctionId', 'productName productImage farmerName')
      .sort({ createdAt: -1 })
    
    res.status(200).json({
      success: true,
      data: orders
    })
  } catch (error) {
    console.error('Get my auction orders error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get your auction orders'
    })
  }
}

/**
 * Get farmer's auction orders (orders for their auctions)
 * GET /api/escrow/farmer-orders
 */
export const getFarmerAuctionOrders = async (req, res) => {
  try {
    const farmerId = req.user._id
    
    // Find orders where the farmer is in the items
    const orders = await Order.find({
      isAuctionOrder: true,
      'items.farmer': farmerId
    })
      .populate('customer', 'fullName email phone')
      .populate('auctionId', 'productName productImage')
      .sort({ createdAt: -1 })
    
    res.status(200).json({
      success: true,
      data: orders
    })
  } catch (error) {
    console.error('Get farmer auction orders error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get farmer orders'
    })
  }
}

export default {
  confirmDelivery,
  releasePayment,
  refundOrder,
  getEscrowSummary,
  getEscrowOrders,
  getEscrowOrderDetails,
  retrySettlement,
  processAutoConfirmations,
  getMyAuctionOrders,
  getFarmerAuctionOrders
}
