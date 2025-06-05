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
    enum: ['cash', 'card', 'upi', 'bank']
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

// Generate payment number before validation
paymentSchema.pre('validate', async function (next) {
  try {
    if (this.isNew && !this.paymentNumber) {
      const date = new Date();
      const year = date.getFullYear().toString().slice(-2);
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      
      // Get the latest payment number for today
      const latestPayment = await this.constructor.findOne(
        { paymentNumber: new RegExp(`^PAY${year}${month}${day}`) },
        { paymentNumber: 1 },
        { sort: { paymentNumber: -1 } }
      );

      let sequence = 1;
      if (latestPayment) {
        const lastSequence = parseInt(latestPayment.paymentNumber.slice(-4));
        sequence = lastSequence + 1;
      }

      this.paymentNumber = `PAY${year}${month}${day}${sequence.toString().padStart(4, '0')}`;
    }
    next();
  } catch (error) {
    next(error);
  }
});

// ✅ Prevent OverwriteModelError
const Payment = mongoose.models.Payment || mongoose.model('Payment', paymentSchema);

export default Payment;
