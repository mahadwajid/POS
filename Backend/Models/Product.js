import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Lighting', 'Switches', 'Cables', 'Tools', 'Accessories', 'Other']
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  costPrice: {
    type: Number,
    required: true,
    min: 0
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  unitType: {
    type: String,
    required: true,
    enum: ['piece', 'meter', 'box', 'set', 'kg'],
    default: 'piece'
  },
  supplier: {
    name: {
      type: String,
      trim: true
    },
    contact: {
      type: String,
      trim: true
    }
  },
  sku: {
    type: String,
    required: true,
    unique: true
  },
  brand: {
    type: String,
    trim: true
  },
  model: {
    type: String,
    trim: true
  },
  warranty: {
    type: Number, // in months
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lowStockAlert: {
    type: Number,
    default: 5
  },
  status: {
    type: String,
    enum: ['In Stock', 'Low Stock', 'Out of Stock'],
    default: 'In Stock'
  }
}, {
  timestamps: true
});

// Virtual for stock status
productSchema.virtual('stockStatus').get(function() {
  if (this.quantity <= 0) return 'Out of Stock';
  if (this.quantity <= this.lowStockAlert) return 'Low Stock';
  return 'In Stock';
});

// Index for faster searches
productSchema.index({ name: 'text', sku: 'text', brand: 'text', category: 'text' });

// Prevent OverwriteModelError
const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

export default Product; 