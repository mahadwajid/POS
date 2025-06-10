import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../Models/User.js';
import jwt from 'jsonwebtoken';

// Load environment variables
dotenv.config({ path: '.env.test' });

// Global test variables
global.adminToken = null;
global.testUser = null;

beforeAll(async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB for testing');

        // Clean up all collections
        const collections = await mongoose.connection.db.collections();
        for (let collection of collections) {
            await collection.deleteMany({});
        }

        // Create admin user
        const admin = new User({
            name: 'Super Admin',
            email: 'admin@example.com',
            password: 'Admin@123',
            role: 'super_admin',
            isActive: true,
            phone: '1234567890',
            address: {
                street: '123 Admin St',
                city: 'Admin City',
                state: 'Admin State',
                pincode: '123456'
            },
            permissions: ['read', 'write', 'admin'],
            lastLogin: new Date(),
            department: 'IT',
            position: 'Admin',
            employeeId: 'ADM001',
            joiningDate: new Date(),
            salary: 100000,
            emergencyContact: {
                name: 'Emergency Contact',
                phone: '9876543210',
                relationship: 'Family'
            },
            documents: ['id-proof.pdf', 'resume.pdf'],
            notes: 'Admin user notes'
        });
        await admin.save();

        // Create test user
        const user = new User({
            name: 'Test User',
            email: 'test@example.com',
            password: 'Test@123',
            role: 'sub_admin',
            isActive: true,
            phone: '9876543210',
            address: {
                street: '456 Test St',
                city: 'Test City',
                state: 'Test State',
                pincode: '654321'
            },
            permissions: ['read', 'write'],
            lastLogin: new Date(),
            department: 'IT',
            position: 'Developer',
            employeeId: 'EMP001',
            joiningDate: new Date(),
            salary: 50000,
            emergencyContact: {
                name: 'Emergency Contact',
                phone: '1234567890',
                relationship: 'Friend'
            },
            documents: ['id-proof.pdf', 'resume.pdf'],
            notes: 'Test user notes'
        });
        await user.save();
        global.testUser = user;

        // Generate admin token
        global.adminToken = jwt.sign(
            { userId: admin._id, role: admin.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );
    } catch (error) {
        console.error('Failed to connect to MongoDB:', error);
        process.exit(1);
    }
});

beforeEach(async () => {
    // Clear all collections except users
    const collections = await mongoose.connection.db.collections();
    for (let collection of collections) {
        if (collection.collectionName !== 'users') {
        await collection.deleteMany({});
        }
    }
});

afterAll(async () => {
    try {
        // Clean up all collections
        const collections = await mongoose.connection.db.collections();
        for (let collection of collections) {
            await collection.deleteMany({});
        }
        await mongoose.connection.close();
        console.log('Disconnected from MongoDB');
    } catch (error) {
        console.error('Error closing MongoDB connection:', error);
    }
}); 