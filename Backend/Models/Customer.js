import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String
  },
  creditLimit: {
    type: Number,
    default: 0,
    min: 0
  },
  totalDue: {
    type: Number,
    default: 0,
    min: 0
  },
  totalPurchases: {
    type: Number,
    default: 0,
    min: 0
  },
  totalPayments: {
    type: Number,
    default: 0,
    min: 0
  },
  notes: String,
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Virtual for remaining credit
customerSchema.virtual('remainingCredit').get(function() {
  return Math.max(0, this.creditLimit - this.totalDue);
});

// Index for faster searches
customerSchema.index({ name: 'text', phone: 'text', email: 'text' });

// Method to update customer's financial data
customerSchema.methods.updateFinancials = async function(amount, type) {
  if (type === 'purchase') {
    this.totalPurchases += amount;
    this.totalDue += amount;
  } else if (type === 'payment') {
    this.totalPayments += amount;
    this.totalDue -= amount;
  }
  await this.save();
};

// Prevent OverwriteModelError
const Customer = mongoose.models.Customer || mongoose.model('Customer', customerSchema);

export default Customer; 