import express from 'express';
import Product from '../Models/Product.js';
import { auth, isSuperAdmin } from '../Middlewares/auth.js';

const router = express.Router();

// Get all products
router.get('/', auth, async (req, res) => {
  try {
    const { search, category, sortBy = 'name', sortOrder = 'asc' } = req.query;
    
    let query = { isActive: true };
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (category) {
      query.category = category;
    }
    
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    const products = await Product.find(query).sort(sort);
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get product by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new product (Super Admin only)
router.post('/', auth, isSuperAdmin, async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      price,
      costPrice,
      quantity,
      sku,
      brand,
      model,
      warranty,
      lowStockAlert
    } = req.body;

    // Check if SKU already exists
    const existingProduct = await Product.findOne({ sku });
    if (existingProduct) {
      return res.status(400).json({ message: 'SKU already exists' });
    }

    const product = new Product({
      name,
      description,
      category,
      price,
      costPrice,
      quantity,
      sku,
      brand,
      model,
      warranty,
      lowStockAlert
    });

    await product.save();
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update product (Super Admin only)
router.put('/:id', auth, isSuperAdmin, async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      price,
      costPrice,
      quantity,
      sku,
      brand,
      model,
      warranty,
      lowStockAlert,
      isActive
    } = req.body;

    // Check if SKU already exists for other products
    if (sku) {
      const existingProduct = await Product.findOne({
        sku,
        _id: { $ne: req.params.id }
      });
      if (existingProduct) {
        return res.status(400).json({ message: 'SKU already exists' });
      }
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      {
        name,
        description,
        category,
        price,
        costPrice,
        quantity,
        sku,
        brand,
        model,
        warranty,
        lowStockAlert,
        isActive
      },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete product (Super Admin only)
router.delete('/:id', auth, isSuperAdmin, async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get low stock products
router.get('/inventory/low-stock', auth, async (req, res) => {
  try {
    const products = await Product.find({
      isActive: true,
      $expr: { $lte: ['$quantity', '$lowStockAlert'] }
    });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router; 