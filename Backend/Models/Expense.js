import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema({
  description: {
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
    enum: ['Cash', 'Card', 'Bank Transfer', 'UPI']
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  reference: {
    type: String,
    trim: true
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
expenseSchema.index({ createdBy: 1, date: -1 });

// Prevent OverwriteModelError
const Expense = mongoose.models.Expense || mongoose.model('Expense', expenseSchema);

export default Expense; 