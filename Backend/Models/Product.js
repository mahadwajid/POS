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
    min: 0,
    default: 0
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  brand: {
    type: String,
    trim: true
  },
  model: {
    type: String,
    trim: true
  },
  supplier: {
    type: mongoose.Schema.Types.Mixed,
    default: { name: '', contact: '' }
  },
  location: {
    type: String,
    trim: true
  },
  taxRate: {
    type: Number,
    default: 0,
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0
  },
  reorderPoint: {
    type: Number,
    default: 0,
    min: 0
  },
  status: {
    type: String,
    enum: ['In Stock', 'Low Stock', 'Out of Stock', 'Discontinued'],
    default: 'In Stock'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lowStockAlert: {
    type: Number,
    default: 10
  },
  warranty: {
    type: Number,
    default: 0
  },
  images: [String],
  barcode: {
    type: String,
    trim: true
  },
  tags: [String],
  notes: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Add indexes
productSchema.index({ name: 1 });
productSchema.index({ category: 1 });
productSchema.index({ brand: 1 });
productSchema.index({ status: 1 });
productSchema.index({ isActive: 1 });
productSchema.index({ createdBy: 1 });

const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

export default Product; 