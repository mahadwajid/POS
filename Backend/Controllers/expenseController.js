import Expense from '../models/Expense.js';

// @desc    Get all expenses
// @route   GET /api/expenses
// @access  Private
export const getExpenses = async (req, res) => {
  try {
    const { startDate, endDate, category, paymentMethod, sort } = req.query;
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

    if (paymentMethod) {
      query.paymentMethod = paymentMethod;
    }

    let sortOption = { date: -1 };
    if (sort) {
      const [field, order] = sort.split(':');
      sortOption = { [field]: order === 'desc' ? -1 : 1 };
    }

    const expenses = await Expense.find(query).sort(sortOption);
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get expense by ID
// @route   GET /api/expenses/:id
// @access  Private
export const getExpenseById = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
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
// @access  Private
export const createExpense = async (req, res) => {
  try {
    const {
      title,
      amount,
      category,
      paymentMethod,
      date,
      description,
      isRecurring,
      recurringFrequency
    } = req.body;

    const expense = await Expense.create({
      title,
      amount,
      category,
      paymentMethod,
      date: date || new Date(),
      description,
      isRecurring,
      recurringFrequency: isRecurring ? recurringFrequency : undefined
    });

    res.status(201).json(expense);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update expense
// @route   PUT /api/expenses/:id
// @access  Private
export const updateExpense = async (req, res) => {
  try {
    const {
      title,
      amount,
      category,
      paymentMethod,
      date,
      description,
      isRecurring,
      recurringFrequency
    } = req.body;

    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    expense.title = title;
    expense.amount = amount;
    expense.category = category;
    expense.paymentMethod = paymentMethod;
    expense.date = date;
    expense.description = description;
    expense.isRecurring = isRecurring;
    expense.recurringFrequency = isRecurring ? recurringFrequency : undefined;

    await expense.save();
    res.json(expense);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete expense
// @route   DELETE /api/expenses/:id
// @access  Private
export const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    await expense.remove();
    res.json({ message: 'Expense removed' });
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