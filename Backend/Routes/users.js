import express from 'express';
import bcrypt from 'bcryptjs';
import User from '../Models/User.js';
import { auth, isSuperAdmin } from '../Middlewares/auth.js';
import {
  getUsers,
  createUser,
  updateUserStatus,
  deleteUser,
  resetUserPassword
} from '../Controllers/userController.js';

const router = express.Router();

// All routes are protected and require super admin role
router.use(auth, isSuperAdmin);

// Get all users
router.get('/', getUsers);

// Get user by ID
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new sub-admin
router.post('/', createUser);

// Update user status
router.put('/:id/status', updateUserStatus);

// Delete user
router.delete('/:id', deleteUser);

// Reset user password
router.post('/:id/reset-password', resetUserPassword);

// Update last login
router.post('/:id/update-last-login', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.lastLogin = new Date();
    await user.save();

    res.json({ message: 'Last login updated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router; 