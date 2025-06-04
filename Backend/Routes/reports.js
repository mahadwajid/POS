import express from 'express';
import Bill from '../Models/Bill.js';
import Product from '../Models/Product.js';
import Expense from '../Models/Expense.js';
import { auth } from '../Middlewares/auth.js';

const router = express.Router();

// Get sales reports
router.get('/sales', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = {};

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Get daily sales data
    const dailySales = await Bill.aggregate([
      { $match: query },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          amount: { $sum: '$total' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          date: '$_id',
          amount: 1,
          count: 1
        }
      }
    ]);

    // Get sales by category
    const categorySales = await Bill.aggregate([
      { $match: query },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $group: {
          _id: '$product.category',
          amount: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
        }
      },
      {
        $project: {
          _id: 0,
          category: '$_id',
          amount: 1
        }
      }
    ]);

    // Get sales by payment method
    const paymentMethodSales = await Bill.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$paymentMethod',
          amount: { $sum: '$total' },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          method: '$_id',
          amount: 1,
          count: 1
        }
      }
    ]);

    res.json({
      daily: dailySales,
      category: categorySales,
      paymentMethods: paymentMethodSales
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get inventory reports
router.get('/inventory', auth, async (req, res) => {
  try {
    // Get inventory by category
    const categoryInventory = await Product.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$category',
          quantity: { $sum: '$quantity' },
          value: { $sum: { $multiply: ['$price', '$quantity'] } }
        }
      },
      {
        $project: {
          _id: 0,
          category: '$_id',
          quantity: 1,
          value: 1
        }
      }
    ]);

    // Get low stock items
    const lowStockItems = await Product.find({
      isActive: true,
      $expr: { $lte: ['$quantity', '$lowStockAlert'] }
    }).select('name quantity lowStockAlert');

    res.json({
      category: categoryInventory,
      lowStock: lowStockItems
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get expense reports
router.get('/expenses', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = {};

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Get expenses by category
    const categoryExpenses = await Expense.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$category',
          amount: { $sum: '$amount' }
        }
      },
      {
        $project: {
          _id: 0,
          category: '$_id',
          amount: 1
        }
      }
    ]);

    // Get monthly expenses
    const monthlyExpenses = await Expense.aggregate([
      { $match: query },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$date' } },
          amount: { $sum: '$amount' }
        }
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          month: '$_id',
          amount: 1
        }
      }
    ]);

    res.json({
      category: categoryExpenses,
      monthly: monthlyExpenses
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router; 