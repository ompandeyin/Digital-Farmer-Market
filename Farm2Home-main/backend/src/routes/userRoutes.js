import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { listUsers, updateUserRole, getUserProfile, updateUserProfile } from '../controllers/userController.js';

const router = express.Router();

router.get('/profile', protect, getUserProfile);

router.put('/profile', protect, updateUserProfile);

router.put('/password', protect, (req, res) => {
  res.json({ success: true, message: 'Change password' });
});

router.get('/dashboard', protect, (req, res) => {
  res.json({ success: true, message: 'Get dashboard' });
});

// Admin: list users
router.get('/', protect, authorize('admin'), listUsers)

// Admin: update user role
router.put('/:id/role', protect, authorize('admin'), updateUserRole)

export default router;
