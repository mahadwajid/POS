import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['Cash', 'Card', 'UPI', 'Bank Transfer', 'Credit']
  },
  paymentNumber: {
    type: String,
    required: true,
    unique: true
  },
  notes: String,
  balanceAfter: {
    type: Number,
    required: true,
    min: 0
  },
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Remove the pre-save hook since we're generating the number in the controller
const Payment = mongoose.models.Payment || mongoose.model('Payment', paymentSchema);

export default Payment;
