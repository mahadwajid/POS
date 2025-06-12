
import express from 'express';
import { auth } from '../Middlewares/auth.js';
import {
  getBills,
  getBillById,
  createBill,
  updateBillPayment,
  deleteBill,
  getTodaySummary,
  getWeeklySummary,
  getMonthlySummary,
  getCategorySummary
} from '../Controllers/billController.js';

const router = express.Router();

// Get bill summaries
router.get('/summary/today', auth, getTodaySummary);
router.get('/summary/weekly', auth, getWeeklySummary);
router.get('/summary/monthly', auth, getMonthlySummary);
router.get('/summary/category', auth, getCategorySummary);

// Get all bills
router.get('/', auth, getBills);

// Get bill by ID
router.get('/:id', auth, getBillById);

// Create new bill
router.post('/', auth, createBill);

// Update bill payment
router.put('/:id/payment', auth, updateBillPayment);

// Delete bill
router.delete('/:id', auth, deleteBill);

export default router; 