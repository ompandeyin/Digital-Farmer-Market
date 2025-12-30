import express from 'express'
import { protect, authorize } from '../middleware/auth.js'
import { getDashboard } from '../controllers/adminController.js'

const router = express.Router()

router.get('/dashboard', protect, authorize('admin'), getDashboard)

export default router
