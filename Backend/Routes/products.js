import express from 'express';
import { auth, isSuperAdmin } from '../Middlewares/auth.js';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getLowStockProducts,
  updateProductQuantity,
  exportProducts
} from '../Controllers/productController.js';

const router = express.Router();

// Get low stock products
router.get('/inventory/low-stock', auth, getLowStockProducts);

// Get all products
router.get('/', auth, getProducts);

// Get product by ID
router.get('/:id', auth, getProductById);

// Create new product (Super Admin only)
router.post('/', auth, isSuperAdmin, createProduct);

// Update product (Super Admin only)
router.put('/:id', auth, isSuperAdmin, updateProduct);

// Delete product (Super Admin only)
router.delete('/:id', auth, isSuperAdmin, deleteProduct);

// Update product quantity
router.put('/:id/quantity', auth, isSuperAdmin, updateProductQuantity);

// Export products to CSV
router.get('/export/csv', auth, isSuperAdmin, exportProducts);

export default router; 