import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../Models/User.js';

dotenv.config();

const createSuperAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Delete existing super admin if exists
    await User.deleteOne({ role: 'super_admin' });
    console.log('Deleted existing super admin if any');

    // Create super admin with a fresh password
    const superAdmin = await User.create({
      name: 'Super Admin',
      email: 'admin@pos.com',
      password: 'Admin@123', // New password with special characters
      role: 'super_admin',
      isActive: true,
      lastLogin: new Date()
    });

    console.log('Super admin created successfully:', {
      name: superAdmin.name,
      email: superAdmin.email,
      role: superAdmin.role
    });

  } catch (error) {
    console.error('Error creating super admin:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

createSuperAdmin(); 