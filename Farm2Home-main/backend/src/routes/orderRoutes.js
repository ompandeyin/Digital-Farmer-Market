import express from 'express';
import { protect } from '../middleware/auth.js';
import { createOrder, getOrdersForUser } from '../controllers/orderController.js';

const router = express.Router();

// Create order (checkout)
router.post('/', protect, createOrder);

// Get orders for logged in user
router.get('/', protect, getOrdersForUser);

// TODO: Add admin order management and single order GET/update/cancel

export default router;
