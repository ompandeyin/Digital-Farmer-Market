/**
 * Settlement Routes (non-breaking aliases)
 * These routes are aliases for the existing /escrow/* endpoints to allow
 * a gradual migration to the more user-friendly "settlement" naming.
 *
 * Note: Controllers are shared with escrowController.js to avoid duplicate logic.
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

// BUYER ROUTES
router.get('/my-orders', protect, getMyAuctionOrders)
router.post('/confirm-delivery/:orderId', protect, confirmDelivery)

// FARMER ROUTES
router.get('/farmer-orders', protect, getFarmerAuctionOrders)

// ADMIN ROUTES
router.get('/summary', protect, authorize('admin'), getEscrowSummary)
router.get('/orders', protect, authorize('admin'), getEscrowOrders)
router.get('/orders/:orderId', protect, getEscrowOrderDetails)
router.post('/release-payment/:orderId', protect, authorize('admin'), releasePayment)
router.post('/refund/:orderId', protect, authorize('admin'), refundOrder)
router.post('/retry-settlement/:auctionId', protect, authorize('admin'), retrySettlement)
router.post('/process-auto-confirmations', protect, authorize('admin'), processAutoConfirmations)

export default router
