import express from 'express'
import { protect, farmerOnly } from '../middleware/auth.js'
import upload from '../middleware/multer.js'
import {
  createAuction,
  getAllAuctions,
  getAuctionById,
  getLiveAuctions,
  placeBid,
  updateAuction,
  deleteAuction,
  endAuction,
  getMyAuctions
} from '../controllers/auctionController.js'

const router = express.Router()

// Public routes
router.get('/', getAllAuctions)
router.get('/live/active', getLiveAuctions)
// Get auctions created by the authenticated user
router.get('/mine', protect, getMyAuctions)
router.get('/:id', getAuctionById)

// Protected routes (farmer only)
router.post('/', protect, farmerOnly, upload.single('productImage'), createAuction)
router.post('/:id/bid', protect, placeBid)
router.put('/:id', protect, farmerOnly, upload.single('productImage'), updateAuction)
router.delete('/:id', protect, farmerOnly, deleteAuction)
router.post('/:id/end', protect, farmerOnly, endAuction)

export default router

