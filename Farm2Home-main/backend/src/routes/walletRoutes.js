import express from 'express'
import { protect, authorize } from '../middleware/auth.js'
import { getWallet, getWalletBalance, requestFunds, listFundRequests, approveFundRequest, rejectFundRequest } from '../controllers/walletController.js'

const router = express.Router()

// Get wallet info + own requests
router.get('/', protect, getWallet)

// Get wallet balance only (quick check)
router.get('/balance', protect, getWalletBalance)

// Create fund request
router.post('/request', protect, requestFunds)

// Admin: list and filter requests
router.get('/requests', protect, authorize('admin'), listFundRequests)

// Admin: approve a request
router.put('/requests/:id/approve', protect, authorize('admin'), approveFundRequest)

// Admin: reject a request
router.put('/requests/:id/reject', protect, authorize('admin'), rejectFundRequest)

export default router
