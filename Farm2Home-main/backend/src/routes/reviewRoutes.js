import express from 'express';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/', protect, (req, res) => {
  res.json({ success: true, message: 'Create review' });
});

router.get('/product/:productId', (req, res) => {
  res.json({ success: true, message: 'Get product reviews' });
});

router.put('/:id', protect, (req, res) => {
  res.json({ success: true, message: 'Update review' });
});

router.delete('/:id', protect, (req, res) => {
  res.json({ success: true, message: 'Delete review' });
});

export default router;
