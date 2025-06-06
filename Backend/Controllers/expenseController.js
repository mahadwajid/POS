import Expense from '../Models/Expense.js';

// @desc    Get all expenses
// @route   GET /api/expenses
// @access  Private
export const getExpenses = async (req, res) => {
  try {
    const { startDate, endDate, category, sort } = req.query;
    const query = {};

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    if (category) {
      query.category = category;
    }

    let sortOption = { date: -1 };
    if (sort) {
      const [field, order] = sort.split(':');
      sortOption = { [field]: order === 'desc' ? -1 : 1 };
    }

    const expenses = await Expense.find(query)
      .populate('createdBy', 'username')
      .sort(sortOption);

    // Calculate total
    const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);

    res.json({
      expenses,
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get expense by ID
// @route   GET /api/expenses/:id
// @access  Private
export const getExpenseById = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id)
      .populate('createdBy', 'username');

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    res.json(expense);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create new expense
// @route   POST /api/expenses
// @access  Private/Admin
export const createExpense = async (req, res) => {
  try {
    const {
      title,
      category,
      amount,
      paymentMethod,
      date,
      description,
      receiptUrl
    } = req.body;

    const expense = await Expense.create({
      title,
      category,
      amount,
      paymentMethod,
      date: date || new Date(),
      description,
      receiptUrl,
      createdBy: req.user._id
    });

    res.status(201).json(expense);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update expense
// @route   PUT /api/expenses/:id
// @access  Private/Admin
export const updateExpense = async (req, res) => {
  try {
    const {
      title,
      category,
      amount,
      paymentMethod,
      date,
      description,
      receiptUrl
    } = req.body;

    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    Object.assign(expense, {
      title,
      category,
      amount,
      paymentMethod,
      date: date || expense.date,
      description,
      receiptUrl
    });

    await expense.save();
    res.json(expense);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete expense
// @route   DELETE /api/expenses/:id
// @access  Private/Admin
export const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    await expense.deleteOne();
    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get expense report
// @route   GET /api/expenses/report
// @access  Private
export const getExpenseReport = async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'month' } = req.query;

    const matchStage = {};
    if (startDate && endDate) {
      matchStage.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const groupStage = {
      _id: groupBy === 'month' 
        ? { $dateToString: { format: '%Y-%m', date: '$date' } }
        : '$category',
      total: { $sum: '$amount' },
      count: { $sum: 1 }
    };

    const report = await Expense.aggregate([
      { $match: matchStage },
      { $group: groupStage },
      { $sort: { _id: 1 } }
    ]);

    // Get category distribution
    const categoryDistribution = await Expense.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' }
        }
      },
      { $sort: { total: -1 } }
    ]);

    res.json({
      report,
      categoryDistribution
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get expense summary
// @route   GET /api/expenses/summary
// @access  Private
export const getExpenseSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = {};

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const summary = await Expense.aggregate([
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

    res.json(summary);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get monthly expense trend
// @route   GET /api/expenses/trend/monthly
// @access  Private
export const getMonthlyExpenseTrend = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastYear = new Date(today);
    lastYear.setFullYear(lastYear.getFullYear() - 1);

    const trend = await Expense.aggregate([
      {
        $match: {
          date: {
            $gte: lastYear,
            $lte: today
          }
        }
      },
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

    res.json(trend);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get payment method distribution
// @route   GET /api/expenses/payment-methods
// @access  Private
export const getPaymentMethodDistribution = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = {};

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const distribution = await Expense.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$paymentMethod',
          total: { $sum: '$amount' },
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

    res.json(distribution);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}; 