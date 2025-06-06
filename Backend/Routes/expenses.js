import express from 'express';
import { auth, isSuperAdmin } from '../Middlewares/auth.js';
import {
  getExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
  getExpenseReport
} from '../Controllers/expenseController.js';

const router = express.Router();

// Get all expenses
router.get('/', auth, getExpenses);

// Get expense by ID
router.get('/:id', auth, getExpenseById);

// Create new expense (Super Admin only)
router.post('/', auth, isSuperAdmin, createExpense);

// Update expense (Super Admin only)
router.put('/:id', auth, isSuperAdmin, updateExpense);

// Delete expense (Super Admin only)
router.delete('/:id', auth, isSuperAdmin, deleteExpense);

// Get expense report
router.get('/report', auth, getExpenseReport);

export default router; 