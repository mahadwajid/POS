import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const fixUserIndexes = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get the users collection
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    // Drop all indexes
    await usersCollection.dropIndexes();
    console.log('Dropped all indexes from users collection');

    // Create new indexes based on current schema
    await usersCollection.createIndex({ email: 1 }, { unique: true });
    console.log('Created new indexes for users collection');

  } catch (error) {
    console.error('Error fixing indexes:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

fixUserIndexes(); 