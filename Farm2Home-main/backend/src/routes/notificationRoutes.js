import express from 'express';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, (req, res) => {
  res.json({ success: true, message: 'Get notifications' });
});

router.put('/:id/read', protect, (req, res) => {
  res.json({ success: true, message: 'Mark as read' });
});

router.delete('/:id', protect, (req, res) => {
  res.json({ success: true, message: 'Delete notification' });
});

router.delete('/', protect, (req, res) => {
  res.json({ success: true, message: 'Clear all notifications' });
});

export default router;
