import mongoose from 'mongoose';
import User from '../Models/User.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the correct path
dotenv.config({ path: path.join(__dirname, '../.env') });

const createSuperAdmin = async () => {
  try {
    console.log('Starting admin user creation...');
    console.log('MongoDB URI:', process.env.MONGODB_URI);

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB successfully');

    // Check if admin user already exists
    console.log('Checking for existing admin user...');
    const existingAdmin = await User.findOne({ username: 'admin' });
    
    if (existingAdmin) {
      console.log('Admin user already exists with ID:', existingAdmin._id);
      process.exit(0);
    }

    console.log('No existing admin found. Creating new admin user...');

    // Create new admin user
    const adminUser = new User({
      username: 'admin',
      password: 'admin123',
      role: 'super_admin',
      fullName: 'Super Admin',
      email: 'admin@example.com',
      isActive: true
    });

    await adminUser.save();
    console.log('Super admin user created successfully with ID:', adminUser._id);
    
    // Verify the user was created
    const verifyUser = await User.findOne({ username: 'admin' });
    console.log('Verification - User exists:', verifyUser ? 'Yes' : 'No');
    if (verifyUser) {
      console.log('User details:', {
        username: verifyUser.username,
        role: verifyUser.role,
        isActive: verifyUser.isActive
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
};

createSuperAdmin(); 