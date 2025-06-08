import jwt from 'jsonwebtoken';
import User from '../Models/User.js';

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded token:', decoded);
    
    const user = await User.findOne({ _id: decoded.userId, isActive: true });
    console.log('Found user:', user ? { id: user._id, role: user.role } : 'No user found');

    if (!user) {
      return res.status(401).json({ message: 'User not found or inactive' });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ message: 'Please authenticate' });
  }
};

const isSuperAdmin = async (req, res, next) => {
  try {
    console.log('Checking super admin access for user:', { id: req.user._id, role: req.user.role });
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({ message: 'Access denied. Super Admin only.' });
    }
    next();
  } catch (error) {
    console.error('Super admin check error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export {
  auth,
  isSuperAdmin
}; 