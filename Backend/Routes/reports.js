import express from 'express';
import { auth, isSuperAdmin } from '../Middlewares/auth.js';
import {
  getSalesReport,
  getExpenseReport,
  getProfitLossReport,
  getCustomerLedgerReport,
  getOutstandingBalancesReport,
  getTopProductsReport
} from '../Controllers/reportController.js';

const router = express.Router();

// Sales Report
router.get('/sales', auth, getSalesReport);

// Expense Report
router.get('/expenses', auth, getExpenseReport);

// Profit & Loss Report
router.get('/profit-loss', auth, getProfitLossReport);

// Customer Ledger Report
router.get('/customer-ledgers', auth, getCustomerLedgerReport);

// Outstanding Balances Report
router.get('/outstanding-balances', auth, getOutstandingBalancesReport);

// Top Products Report
router.get('/top-products', auth, getTopProductsReport);

export default router; 