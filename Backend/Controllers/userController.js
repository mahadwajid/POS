import bcrypt from 'bcryptjs';
import User from '../Models/User.js';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

// @desc    Get all users (only for super admin)
// @route   GET /api/users
// @access  Private/Super Admin
export const getUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 });

    res.json(users);
  } catch (error) {
    console.error('Users fetch error:', error);
    res.status(500).json({ 
      message: 'Server error',
      details: error.message 
    });
  }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private/SuperAdmin
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }

    const user = await User.findById(id).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('User fetch error:', error);
    res.status(500).json({ 
      message: 'Server error',
      details: error.message 
    });
  }
};

// @desc    Create new sub-admin
// @route   POST /api/users
// @access  Private/Super Admin
export const createUser = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone = '',
      role = 'user',
      isActive = true,
      address = {},
      permissions = [],
      department = '',
      position = '',
      employeeId = '',
      joiningDate,
      salary = 0,
      emergencyContact = {},
      documents = [],
      notes = ''
    } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ 
        message: 'Missing required fields',
        required: ['name', 'email', 'password']
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      phone,
      role,
      isActive,
      address,
      permissions,
      department,
      position,
      employeeId,
      joiningDate,
      salary,
      emergencyContact,
      documents,
      notes,
      createdBy: req.user._id
    });

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json(userResponse);
  } catch (error) {
    console.error('User creation error:', error);
    res.status(500).json({ 
      message: 'Server error',
      details: error.message 
    });
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/SuperAdmin
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }

    // Don't allow password update through this route
    delete updateData.password;

    // Find and update user
    const user = await User.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('User update error:', error);
    res.status(500).json({ 
      message: 'Server error',
      details: error.message 
    });
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
    const { id } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }

    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('User deletion error:', error);
    res.status(500).json({ 
      message: 'Server error',
      details: error.message 
    });
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