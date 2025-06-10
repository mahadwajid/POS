import express from 'express';
import { auth } from '../Middlewares/auth.js';
import {
  getExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
  getExpenseSummary
} from '../Controllers/expenseController.js';

const router = express.Router();

// Get all expenses
router.get('/', auth, getExpenses);

// Get expense summary
router.get('/summary', auth, getExpenseSummary);

// Get expense by id
router.get('/:id', auth, getExpenseById);

// Create new expense
router.post('/', auth, createExpense);

// Update expense
router.put('/:id', auth, updateExpense);

// Delete expense
router.delete('/:id', auth, deleteExpense);

export default router; 