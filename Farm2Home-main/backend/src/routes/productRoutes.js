import express from 'express';
import { protect, authorize, farmerOnly } from '../middleware/auth.js';
import { createLimiter, searchLimiter } from '../middleware/rateLimiter.js';
import upload from '../middleware/multer.js';
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  searchProducts,
  getFeaturedProducts,
  getProductsByCategory,
  getProductsByFarmer
} from '../controllers/productController.js';

const router = express.Router();

// Public routes
router.get('/', getAllProducts);
router.get('/featured', getFeaturedProducts);
router.get('/search', searchLimiter, searchProducts);
router.get('/category/:category', getProductsByCategory);
router.get('/farmer/:farmerId', getProductsByFarmer);
router.get('/:id', getProductById);

// Protected routes
// Allow any authenticated user to create products (customers can list products too)
router.post('/', protect, upload.single('image'), createLimiter, createProduct);
// Still require ownership for update/delete
router.put('/:id', protect, farmerOnly, updateProduct);
router.delete('/:id', protect, farmerOnly, deleteProduct);

export default router;
