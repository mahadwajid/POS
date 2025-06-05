import { Product } from '../Models/index.js';
import { Bill } from '../Models/index.js';
import { Expense } from '../Models/index.js';

// @desc    Get sales report
// @route   GET /api/reports/sales
// @access  Private
export const getSalesReport = async (req, res) => {
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
          total: { $sum: '$total' },
          paid: { $sum: '$paidAmount' },
          due: { $sum: '$dueAmount' },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          date: '$_id',
          total: 1,
          paid: 1,
          due: 1,
          count: 1
        }
      },
      { $sort: { date: 1 } }
    ]);

    // Get sales by category
    const salesByCategory = await Bill.aggregate([
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
          total: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          count: { $sum: '$items.quantity' }
        }
      },
      {
        $project: {
          _id: 0,
          category: '$_id',
          total: 1,
          count: 1
        }
      }
    ]);

    // Get sales by payment method
    const salesByPaymentMethod = await Bill.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$paymentMethod',
          total: { $sum: '$total' },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          method: '$_id',
          total: 1,
          count: 1
        }
      }
    ]);

    res.json({
      dailySales,
      salesByCategory,
      salesByPaymentMethod
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get inventory report
// @route   GET /api/reports/inventory
// @access  Private
export const getInventoryReport = async (req, res) => {
  try {
    // Get inventory by category
    const inventoryByCategory = await Product.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$category',
          totalItems: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' },
          totalValue: { $sum: { $multiply: ['$price', '$quantity'] } }
        }
      },
      {
        $project: {
          _id: 0,
          category: '$_id',
          totalItems: 1,
          totalQuantity: 1,
          totalValue: 1
        }
      }
    ]);

    // Get low stock items
    const lowStockItems = await Product.find({
      isActive: true,
      $expr: { $lte: ['$quantity', '$lowStockAlert'] }
    }).select('name sku category quantity lowStockAlert price');

    res.json({
      inventoryByCategory,
      lowStockItems
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get expense report
// @route   GET /api/reports/expenses
// @access  Private
export const getExpenseReport = async (req, res) => {
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
    const expensesByCategory = await Expense.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          category: '$_id',
          total: 1,
          count: 1
        }
      }
    ]);

    // Get monthly expenses
    const monthlyExpenses = await Expense.aggregate([
      { $match: query },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$date' } },
          total: { $sum: '$amount' }
        }
      },
      {
        $project: {
          _id: 0,
          month: '$_id',
          total: 1
        }
      },
      { $sort: { month: 1 } }
    ]);

    res.json({
      expensesByCategory,
      monthlyExpenses
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get profit and loss report
// @route   GET /api/reports/profit-loss
// @access  Private
export const getProfitLossReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = {};

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Get total sales
    const salesData = await Bill.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$total' },
          totalPaid: { $sum: '$paidAmount' },
          totalDue: { $sum: '$dueAmount' }
        }
      }
    ]);

    // Get total expenses
    const expenseData = await Expense.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalExpenses: { $sum: '$amount' }
        }
      }
    ]);

    const sales = salesData[0] || { totalSales: 0, totalPaid: 0, totalDue: 0 };
    const expenses = expenseData[0] || { totalExpenses: 0 };

    const profitLoss = {
      totalSales: sales.totalSales,
      totalPaid: sales.totalPaid,
      totalDue: sales.totalDue,
      totalExpenses: expenses.totalExpenses,
      netProfit: sales.totalPaid - expenses.totalExpenses
    };

    res.json(profitLoss);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}; 