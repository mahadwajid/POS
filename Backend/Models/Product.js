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
  }
}, {
  timestamps: true
});

// Index for faster searches
productSchema.index({ name: 'text', sku: 'text', brand: 'text' });

export default mongoose.model('Product', productSchema); 