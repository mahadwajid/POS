import express from 'express';
import { auth, isSuperAdmin } from '../Middlewares/auth.js';
import {
  getSalesReport,
  getInventoryReport,
  getCustomerReport,
  getExpenseReport,
  getProfitLossReport,
  getCustomerLedgerReport,
  getOutstandingBalancesReport,
  getTopProductsReport
} from '../Controllers/reportController.js';

const router = express.Router();

// All routes are protected
router.use(auth);

// Get sales report
router.get('/sales', getSalesReport);

// Get inventory report
router.get('/inventory', getInventoryReport);

// Get customer report
router.get('/customers', getCustomerReport);

// Get expense report
router.get('/expenses', getExpenseReport);

// Get profit & loss report
router.get('/profit-loss', getProfitLossReport);

// Get customer ledger report
router.get('/customer-ledgers', getCustomerLedgerReport);

// Get outstanding balances report
router.get('/outstanding-balances', getOutstandingBalancesReport);

// Get top products report
router.get('/top-products', getTopProductsReport);

export default router; 