import { Product } from '../Models/index.js';

// @desc    Get all products
// @route   GET /api/products
// @access  Private
export const getProducts = async (req, res) => {
  try {
    const { search, category, sort, stockStatus, supplier } = req.query;
    const query = { isActive: true };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { 'supplier.name': { $regex: search, $options: 'i' } }
      ];
    }

    if (category) {
      query.category = category;
    }

    if (supplier) {
      query['supplier.name'] = { $regex: supplier, $options: 'i' };
    }

    if (stockStatus) {
      switch (stockStatus) {
        case 'low':
          query.$expr = { $lte: ['$quantity', '$lowStockAlert'] };
          break;
        case 'out':
          query.quantity = 0;
          break;
        case 'in':
          query.$expr = { $gt: ['$quantity', '$lowStockAlert'] };
          break;
      }
    }

    let sortOption = { createdAt: -1 };
    if (sort) {
      const [field, order] = sort.split(':');
      sortOption = { [field]: order === 'desc' ? -1 : 1 };
    }

    const products = await Product.find(query).sort(sortOption);
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get product by ID
// @route   GET /api/products/:id
// @access  Private
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create new product
// @route   POST /api/products
// @access  Private/Admin
export const createProduct = async (req, res) => {
  try {
    const {
      name,
      sku,
      category,
      price,
      costPrice,
      quantity,
      lowStockAlert,
      brand,
      model,
      warranty,
      description,
      unitType,
      supplier
    } = req.body;

    // Check if SKU exists
    const skuExists = await Product.findOne({ sku });
    if (skuExists) {
      return res.status(400).json({ message: 'SKU already exists' });
    }

    const product = await Product.create({
      name,
      sku,
      category,
      price,
      costPrice,
      quantity,
      lowStockAlert,
      brand,
      model,
      warranty,
      description,
      unitType,
      supplier,
      status: quantity <= 0 ? 'Out of Stock' : 
              quantity <= lowStockAlert ? 'Low Stock' : 'In Stock'
    });

    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private/Admin
export const updateProduct = async (req, res) => {
  try {
    const {
      name,
      sku,
      category,
      price,
      costPrice,
      quantity,
      lowStockAlert,
      brand,
      model,
      warranty,
      description,
      isActive,
      unitType,
      supplier
    } = req.body;

    // Check if product exists
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if SKU is taken by another product
    if (sku !== product.sku) {
      const skuExists = await Product.findOne({ sku });
      if (skuExists) {
        return res.status(400).json({ message: 'SKU already exists' });
      }
    }

    // Update product
    Object.assign(product, {
      name,
      sku,
      category,
      price,
      costPrice,
      quantity,
      lowStockAlert,
      brand,
      model,
      warranty,
      description,
      isActive,
      unitType,
      supplier,
      status: quantity <= 0 ? 'Out of Stock' : 
              quantity <= lowStockAlert ? 'Low Stock' : 'In Stock'
    });

    await product.save();
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private/Admin
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Soft delete
    product.isActive = false;
    await product.save();

    res.json({ message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Export products to CSV
// @route   GET /api/products/export
// @access  Private/Admin
export const exportProducts = async (req, res) => {
  try {
    const products = await Product.find({ isActive: true });
    
    // Convert products to CSV format
    const csvData = products.map(product => ({
      Name: product.name,
      SKU: product.sku,
      Category: product.category,
      Price: product.price,
      Cost: product.costPrice,
      Quantity: product.quantity,
      Unit: product.unitType,
      Status: product.status,
      Supplier: product.supplier?.name || '',
      Brand: product.brand || '',
      Model: product.model || ''
    }));

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=products.csv');
    
    // Convert to CSV string
    const csvString = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    res.send(csvString);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get low stock products
// @route   GET /api/products/inventory/low-stock
// @access  Private
export const getLowStockProducts = async (req, res) => {
  try {
    const lowStockThreshold = 10; // Products with quantity less than this are considered low stock
    const products = await Product.find({
      quantity: { $lt: lowStockThreshold },
      isActive: true
    }).select('name sku price quantity category');

    res.json(products);
  } catch (error) {
    console.error('Low stock products error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update product quantity
// @route   PUT /api/products/:id/quantity
// @access  Private/Admin
export const updateProductQuantity = async (req, res) => {
  try {
    const { quantity } = req.body;

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    product.quantity = quantity;
    await product.save();

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}; 