import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './Config/connection.js';

// Import routes
import authRoutes from './Routes/auth.js';
import productRoutes from './Routes/products.js';
import customerRoutes from './Routes/customers.js';
import billRoutes from './Routes/bills.js';
import expenseRoutes from './Routes/expenses.js';
import reportRoutes from './Routes/reports.js';
import userRoutes from './Routes/users.js';

// Load environment variables
dotenv.config();

const app = express();

// CORS configuration
app.use(cors({
  origin: ['http://localhost:3000', 'https://pos-seven-pink.vercel.app'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Middleware
app.use(express.json());

// Health check route
app.get('/', (req, res) => {
  res.json({ message: 'POS API is running' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/users', userRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Initialize server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Only start the server if this file is run directly
if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export default app;
