import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Load environment variables
dotenv.config();

// Connect to MongoDB before running tests
beforeAll(async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB for testing');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
});

// Clear database after each test
afterEach(async () => {
    try {
        const collections = await mongoose.connection.db.collections();
        for (let collection of collections) {
            await collection.deleteMany({});
        }
    } catch (error) {
        console.error('Error clearing database:', error);
    }
});

// Disconnect from MongoDB after all tests
afterAll(async () => {
    try {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    } catch (error) {
        console.error('Error disconnecting from MongoDB:', error);
    }
}); 