import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: String,
    required: true,
    enum: ['Rent', 'Utilities', 'Salaries', 'Inventory', 'Maintenance', 'Marketing', 'Other']
  },
  date: {
    type: Date,
    required: true
  },
  description: {
    type: String,
    trim: true
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'Card', 'Bank Transfer'],
    required: true
  },
  receipt: {
    type: String // URL or path to receipt image/document
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringDetails: {
    frequency: {
      type: String,
      enum: ['Daily', 'Weekly', 'Monthly', 'Yearly']
    },
    nextDueDate: Date
  }
}, {
  timestamps: true
});

// Index for faster searches
expenseSchema.index({ date: -1, category: 1 });

export default mongoose.model('Expense', expenseSchema); 