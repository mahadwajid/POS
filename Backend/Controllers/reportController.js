import { Product } from '../Models/index.js';
import { Bill } from '../Models/index.js';
import { Expense } from '../Models/index.js';
import Customer from '../Models/Customer.js';

// Helper function to get date range
const getDateRange = (startDate, endDate) => {
  const query = {};
  if (startDate && endDate) {
    // Set start date to beginning of day
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    // Set end date to end of day
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    query.createdAt = {
      $gte: start,
      $lte: end
    };
  }
  return query;
};

// @desc    Get sales report
// @route   GET /api/reports/sales
// @access  Private
export const getSalesReport = async (req, res) => {
  try {
    const { startDate, endDate, customer } = req.query;
    console.log('Query params:', { startDate, endDate, customer });
    
    const query = getDateRange(startDate, endDate);
    if (customer) query.customer = customer;

    console.log('MongoDB query:', JSON.stringify(query, null, 2));

    // Get sales data
    const sales = await Bill.find(query)
      .populate('customer', 'name phone')
      .sort({ createdAt: -1 });

    console.log('Found sales:', sales.length);

    // Calculate totals
    const totals = sales.reduce((acc, sale) => ({
      total: acc.total + (sale.total || 0),
      paid: acc.paid + (sale.paidAmount || 0),
      due: acc.due + (sale.dueAmount || 0)
    }), { total: 0, paid: 0, due: 0 });

    // Get daily sales trend
    const dailySales = await Bill.aggregate([
      { $match: query },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          amount: { $sum: '$total' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      sales,
      totals,
      dailySales
    });
  } catch (error) {
    console.error('Sales report error:', error);
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
    const { startDate, endDate, category } = req.query;
    const query = getDateRange(startDate, endDate);
    if (category) query.category = category;

    // Get expenses
    const expenses = await Expense.find(query).sort({ date: -1 });

    // Calculate total
    const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    // Get category-wise expenses
    const categoryExpenses = await Expense.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$category',
          amount: { $sum: '$amount' }
        }
      }
    ]);

    // Get monthly trend
    const monthlyExpenses = await Expense.aggregate([
      { $match: query },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$date' } },
          amount: { $sum: '$amount' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      expenses,
      total,
      categoryExpenses,
      monthlyExpenses
    });
  } catch (error) {
    console.error('Expense report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get profit & loss report
// @route   GET /api/reports/profit-loss
// @access  Private
export const getProfitLossReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = getDateRange(startDate, endDate);

    // Get total sales
    const salesData = await Bill.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$total' },
          totalCost: { $sum: '$costPrice' }
        }
      }
    ]);

    // Get total expenses
    const expensesData = await Expense.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalExpenses: { $sum: '$amount' }
        }
      }
    ]);

    const totalSales = salesData[0]?.totalSales || 0;
    const totalCost = salesData[0]?.totalCost || 0;
    const totalExpenses = expensesData[0]?.totalExpenses || 0;
    const grossProfit = totalSales - totalCost;
    const netProfit = grossProfit - totalExpenses;

    // Get monthly profit trend
    const monthlyProfit = await Bill.aggregate([
      { $match: query },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$date' } },
          sales: { $sum: '$total' },
          cost: { $sum: '$costPrice' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      totalSales,
      totalCost,
      totalExpenses,
      grossProfit,
      netProfit,
      monthlyProfit
    });
  } catch (error) {
    console.error('Profit & Loss report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get customer ledger report
// @route   GET /api/reports/customer-ledgers
// @access  Private
export const getCustomerLedgerReport = async (req, res) => {
  try {
    const { customer } = req.query;
    const query = customer ? { _id: customer } : {};

    const customers = await Customer.find(query).select('name phone totalDue');
    const ledgers = await Promise.all(
      customers.map(async (customer) => {
        const bills = await Bill.find({ customer: customer._id })
          .sort({ date: -1 })
          .limit(5);
        
        const payments = bills.reduce((sum, bill) => sum + bill.paidAmount, 0);
        const total = bills.reduce((sum, bill) => sum + bill.total, 0);

        return {
          customer: {
            _id: customer._id,
            name: customer.name,
            phone: customer.phone
          },
          totalBilled: total,
          totalPaid: payments,
          totalDue: customer.totalDue,
          lastTransaction: bills[0]?.date || null
        };
      })
    );

    res.json(ledgers);
  } catch (error) {
    console.error('Customer ledger report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get outstanding balances report
// @route   GET /api/reports/outstanding-balances
// @access  Private
export const getOutstandingBalancesReport = async (req, res) => {
  try {
    const customers = await Customer.find({ totalDue: { $gt: 0 } })
      .select('name phone totalDue')
      .sort({ totalDue: -1 });

    const balances = await Promise.all(
      customers.map(async (customer) => {
        const lastBill = await Bill.findOne({ customer: customer._id })
          .sort({ date: -1 })
          .select('billNumber date');

        const lastPayment = await Bill.findOne({
          customer: customer._id,
          paidAmount: { $gt: 0 }
        })
          .sort({ date: -1 })
          .select('date paidAmount');

        return {
          customer: {
            _id: customer._id,
            name: customer.name,
            phone: customer.phone
          },
          totalDue: customer.totalDue,
          lastInvoice: lastBill ? {
            number: lastBill.billNumber,
            date: lastBill.date
          } : null,
          lastPayment: lastPayment ? {
            date: lastPayment.date,
            amount: lastPayment.paidAmount
          } : null
        };
      })
    );

    res.json(balances);
  } catch (error) {
    console.error('Outstanding balances report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get top products report
// @route   GET /api/reports/top-products
// @access  Private
export const getTopProductsReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = getDateRange(startDate, endDate);

    const topProducts = await Bill.aggregate([
      { $match: query },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $project: {
          _id: 0,
          product: {
            _id: '$product._id',
            name: '$product.name',
            sku: '$product.sku'
          },
          totalQuantity: 1,
          totalRevenue: 1,
          averagePrice: { $divide: ['$totalRevenue', '$totalQuantity'] }
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 10 }
    ]);

    res.json(topProducts);
  } catch (error) {
    console.error('Top products report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
}; 