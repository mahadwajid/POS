import express from 'express';
import { auth, isSuperAdmin } from '../Middlewares/auth.js';
import {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerLedger,
  recordPayment
} from '../Controllers/customerController.js';

const router = express.Router();

// Get all customers
router.get('/', auth, getCustomers);

// Get customer by ID
router.get('/:id', auth, getCustomerById);

// Create new customer (Super Admin only)
router.post('/', auth, isSuperAdmin, createCustomer);

// Update customer (Super Admin only)
router.put('/:id', auth, isSuperAdmin, updateCustomer);

// Delete customer (Super Admin only)
router.delete('/:id', auth, isSuperAdmin, deleteCustomer);

// Get customer ledger
router.get('/:id/ledger', auth, getCustomerLedger);

// Record customer payment (Super Admin only)
router.post('/:id/payment', auth, isSuperAdmin, recordPayment);

export default router; 