import bcrypt from 'bcryptjs';
import User from '../Models/User.js';
import jwt from 'jsonwebtoken';

// @desc    Get all users (only for super admin)
// @route   GET /api/users
// @access  Private/Super Admin
export const getUsers = async (req, res) => {
  try {
    // Get all users except the current user
    const users = await User.find({ _id: { $ne: req.user._id } })
      .select('-password')
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private/SuperAdmin
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create new sub-admin
// @route   POST /api/users
// @access  Private/Super Admin
export const createUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    const user = new User({
      name,
      email,
      password,
      role: 'sub_admin',
      createdBy: req.user._id
    });

    await user.save();

    // Return user without password
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json(userResponse);
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/SuperAdmin
export const updateUser = async (req, res) => {
  try {
    const { username, email, role, isActive } = req.body;

    // Check if user exists
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if email or username is taken
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
      _id: { $ne: req.params.id }
    });
    if (existingUser) {
      return res.status(400).json({ message: 'Email or username already taken' });
    }

    // Update user
    user.username = username;
    user.email = email;
    user.role = role;
    user.isActive = isActive;

    await user.save();

    // Return updated user without password
    const userResponse = user.toObject();
    delete userResponse.password;

    res.json(userResponse);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update user status
// @route   PUT /api/users/:id/status
// @access  Private/Super Admin
export const updateUserStatus = async (req, res) => {
  try {
    const { isActive } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent updating super admin
    if (user.role === 'super_admin') {
      return res.status(403).json({ message: 'Cannot update super admin' });
    }

    user.isActive = isActive;
    await user.save();

    res.json({ message: 'User status updated successfully' });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Super Admin
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent deleting super admin
    if (user.role === 'super_admin') {
      return res.status(403).json({ message: 'Cannot delete super admin' });
    }

    await user.remove();
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Reset user password
// @route   POST /api/users/:id/reset-password
// @access  Private/Super Admin
export const resetUserPassword = async (req, res) => {
  try {
    const { password } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent resetting super admin password
    if (user.role === 'super_admin') {
      return res.status(403).json({ message: 'Cannot reset super admin password' });
    }

    user.password = password;
    await user.save();

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update last login
// @route   POST /api/users/:id/update-last-login
// @access  Private
export const updateLastLogin = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.lastLogin = new Date();
    await user.save();

    res.json({ message: 'Last login updated' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}; 