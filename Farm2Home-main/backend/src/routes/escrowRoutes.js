/**
 * Escrow Routes
 * Handles all escrow-related API endpoints
 */

import express from 'express'
import { protect, authorize } from '../middleware/auth.js'
import {
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
} from '../controllers/escrowController.js'

const router = express.Router()

// ================================
// BUYER ROUTES
// ================================

// Get buyer's auction orders
router.get('/my-orders', protect, getMyAuctionOrders)

// Buyer confirms delivery (releases payment to farmer)
router.post('/confirm-delivery/:orderId', protect, confirmDelivery)

// ================================
// FARMER ROUTES
// ================================

// Get farmer's auction orders
router.get('/farmer-orders', protect, getFarmerAuctionOrders)

// ================================
// ADMIN ROUTES
// ================================

// Get escrow summary (admin dashboard)
router.get('/summary', protect, authorize('admin'), getEscrowSummary)

// Get all escrow orders (admin)
router.get('/orders', protect, authorize('admin'), getEscrowOrders)

// Get single escrow order details (buyer, farmer, or admin)
router.get('/orders/:orderId', protect, getEscrowOrderDetails)

// Admin releases payment manually
router.post('/release-payment/:orderId', protect, authorize('admin'), releasePayment)

// Admin refunds escrow to buyer
router.post('/refund/:orderId', protect, authorize('admin'), refundOrder)

// Admin retries failed settlement
router.post('/retry-settlement/:auctionId', protect, authorize('admin'), retrySettlement)

// Admin triggers auto-confirmation processing
router.post('/process-auto-confirmations', protect, authorize('admin'), processAutoConfirmations)

export default router
