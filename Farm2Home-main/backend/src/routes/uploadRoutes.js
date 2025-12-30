import express from 'express'
import { protect } from '../middleware/auth.js'
import upload from '../middleware/multer.js'
import { uploadImage, deleteImage } from '../controllers/uploadController.js'

const router = express.Router()

// Upload image route - farmer/authenticated users only
router.post('/image', protect, upload.single('file'), uploadImage)

// Delete image route
router.delete('/image', protect, deleteImage)

export default router
