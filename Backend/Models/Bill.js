import mongoose from 'mongoose';

const billSchema = new mongoose.Schema({
  billNumber: {
    type: String,
    required: true,
    unique: true
  },
  reference: {
    type: String,
    unique: true,
    sparse: true,
    default: function() {
      return `BILL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    discount: {
      type: Number,
      default: 0,
      min: 0
    },
    tax: {
      type: Number,
      default: 0,
      min: 0
    },
    total: {
      type: Number,
      required: true,
      min: 0
    }
  }],
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  tax: {
    type: Number,
    default: 0,
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0
  },
  total: {
    type: Number,
    required: true,
    min: 0
  },
  paidAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  dueAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'bank_transfer', 'upi', 'wallet', 'cheque', 'credit'],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'partial', 'paid'],
    default: 'pending'
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'cancelled', 'refunded', 'paid'],
    default: 'pending'
  },
  notes: String,
  type: {
    type: String,
    enum: ['sale', 'purchase', 'return'],
    default: 'sale'
  },
  date: {
    type: Date,
    default: Date.now
  },
  dueDate: Date,
  shippingAddress: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    country: String
  },
  billingAddress: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    country: String
  },
  shippingMethod: String,
  shippingCost: {
    type: Number,
    default: 0,
    min: 0
  },
  handlingCost: {
    type: Number,
    default: 0,
    min: 0
  },
  insuranceCost: {
    type: Number,
    default: 0,
    min: 0
  },
  currency: {
    type: String,
    default: 'USD'
  },
  exchangeRate: {
    type: Number,
    default: 1
  },
  attachments: [String],
  tags: [String],
  metadata: mongoose.Schema.Types.Mixed,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Add indexes
billSchema.index({ billNumber: 1 });
billSchema.index({ reference: 1 }, { sparse: true });
billSchema.index({ customer: 1 });
billSchema.index({ status: 1 });
billSchema.index({ paymentStatus: 1 });
billSchema.index({ date: 1 });
billSchema.index({ createdBy: 1 });

const Bill = mongoose.models.Bill || mongoose.model('Bill', billSchema);

export default Bill; 