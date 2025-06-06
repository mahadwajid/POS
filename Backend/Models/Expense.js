import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Rent', 'Utilities', 'Salary', 'Marketing', 'Maintenance', 'Office Supplies', 'Travel', 'Misc']
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['cash', 'card', 'bank', 'upi']
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  description: {
    type: String,
    trim: true
  },
  receiptUrl: {
    type: String
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

// Prevent OverwriteModelError
const Expense = mongoose.models.Expense || mongoose.model('Expense', expenseSchema);

export default Expense; 