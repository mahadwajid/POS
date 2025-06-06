import express from 'express';
import { Product } from '../Models/index.js';
import Bill from '../Models/Bill.js';
import Customer from '../Models/Customer.js';
import { auth, isSuperAdmin } from '../Middlewares/auth.js';
import {
  getBills,
  getBillById,
  createBill,
  updateBillPayment,
  getTodaySalesSummary,
  getWeeklySalesSummary,
  getMonthlySalesSummary,
  getCategorySalesSummary,
  deleteBill
} from '../Controllers/billController.js';

const router = express.Router();

// Get all bills
router.get('/', auth, getBills);

// Get bill by ID
router.get('/:id', auth, getBillById);

// Create new bill
router.post('/', auth, createBill);

// Update bill payment
router.put('/:id/payment', auth, updateBillPayment);

// Delete bill (Super Admin only)
router.delete('/:id', auth, isSuperAdmin, deleteBill);

// Get sales summaries
router.get('/summary/today', auth, getTodaySalesSummary);
router.get('/summary/weekly', auth, getWeeklySalesSummary);
router.get('/summary/monthly', auth, getMonthlySalesSummary);
router.get('/summary/category', auth, getCategorySalesSummary);

export default router; 