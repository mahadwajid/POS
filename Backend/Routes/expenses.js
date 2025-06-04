import express from 'express';
import Expense from '../Models/Expense.js';
import { auth, isSuperAdmin } from '../Middlewares/auth.js';

const router = express.Router();

// Get all expenses
router.get('/', auth, async (req, res) => {
  try {
    const { startDate, endDate, category, sortBy = 'date', sortOrder = 'desc' } = req.query;
    
    let query = {};
    
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    if (category) {
      query.category = category;
    }
    
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    const expenses = await Expense.find(query)
      .populate('createdBy', 'username fullName')
      .sort(sort);
    
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get expense by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id)
      .populate('createdBy', 'username fullName');
      
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }
    res.json(expense);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new expense
router.post('/', auth, async (req, res) => {
  try {
    const {
      title,
      amount,
      category,
      date,
      description,
      paymentMethod,
      receipt,
      isRecurring,
      recurringDetails
    } = req.body;

    const expense = new Expense({
      title,
      amount,
      category,
      date,
      description,
      paymentMethod,
      receipt,
      isRecurring,
      recurringDetails,
      createdBy: req.user._id
    });

    await expense.save();
    
    const populatedExpense = await Expense.findById(expense._id)
      .populate('createdBy', 'username fullName');
    
    res.status(201).json(populatedExpense);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update expense
router.put('/:id', auth, async (req, res) => {
  try {
    const {
      title,
      amount,
      category,
      date,
      description,
      paymentMethod,
      receipt,
      isRecurring,
      recurringDetails
    } = req.body;

    const expense = await Expense.findByIdAndUpdate(
      req.params.id,
      {
        title,
        amount,
        category,
        date,
        description,
        paymentMethod,
        receipt,
        isRecurring,
        recurringDetails
      },
      { new: true }
    ).populate('createdBy', 'username fullName');

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    res.json(expense);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete expense (Super Admin only)
router.delete('/:id', auth, isSuperAdmin, async (req, res) => {
  try {
    const expense = await Expense.findByIdAndDelete(req.params.id);

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get expenses summary
router.get('/summary/period', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Start date and end date are required' });
    }
    
    const summary = await Expense.aggregate([
      {
        $match: {
          date: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
          }
        }
      },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);
    
    const total = summary.reduce((acc, curr) => acc + curr.total, 0);
    
    res.json({
      byCategory: summary,
      total,
      count: summary.reduce((acc, curr) => acc + curr.count, 0)
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router; 