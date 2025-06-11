import { Customer } from '../Models/index.js';
import Bill from '../Models/Bill.js';
import Payment from '../Models/Payment.js';

// @desc    Get all customers
// @route   GET /api/customers
// @access  Private
export const getCustomers = async (req, res) => {
  try {
    const { search, hasDue } = req.query;
    const query = { isActive: true };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (hasDue === 'true') {
      query.totalDue = { $gt: 0 };
    }

    const customers = await Customer.find(query).sort({ name: 1 });
    res.json(customers);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get customer by ID
// @route   GET /api/customers/:id
// @access  Private
export const getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    res.json(customer);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create new customer
// @route   POST /api/customers
// @access  Private/Admin
export const createCustomer = async (req, res) => {
  try {
    const {
      name,
      phone,
      email,
      address,
      notes
    } = req.body;

    // Check if phone number exists
    const phoneExists = await Customer.findOne({ phone });
    if (phoneExists) {
      return res.status(400).json({ message: 'Phone number already registered' });
    }

    const customer = await Customer.create({
      name,
      phone,
      email,
      address,
      notes
    });

    res.status(201).json(customer);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update customer
// @route   PUT /api/customers/:id
// @access  Private/Admin
export const updateCustomer = async (req, res) => {
  try {
    const {
      name,
      phone,
      email,
      address,
      notes
    } = req.body;

    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Check if phone number is taken by another customer
    if (phone !== customer.phone) {
      const phoneExists = await Customer.findOne({ phone });
      if (phoneExists) {
        return res.status(400).json({ message: 'Phone number already registered' });
      }
    }

    Object.assign(customer, {
      name,
      phone,
      email,
      address,
      notes
    });

    await customer.save();
    res.json(customer);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete customer
// @route   DELETE /api/customers/:id
// @access  Private/Admin
export const deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Check for unpaid bills
    const unpaidBills = await Bill.find({
      customer: customer._id,
      dueAmount: { $gt: 0 }
    });

    if (unpaidBills.length > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete customer with unpaid bills',
        unpaidBills: unpaidBills.map(bill => ({
          billNumber: bill.billNumber,
          amount: bill.total,
          dueAmount: bill.dueAmount,
          status: bill.status
        }))
      });
    }

    // Delete all related records
    await Promise.all([
      // Delete all bills
      Bill.deleteMany({ customer: customer._id }),
      // Delete all payments
      Payment.deleteMany({ customer: customer._id }),
      // Delete the customer
      Customer.findByIdAndDelete(customer._id)
    ]);

    res.json({ 
      message: 'Customer and all related records deleted successfully',
      customer: {
        id: customer._id,
        name: customer.name,
        phone: customer.phone
      }
    });
  } catch (error) {
    console.error('Customer deletion error:', error);
    res.status(500).json({ 
      message: 'Server error',
      details: error.message
    });
  }
};

// @desc    Get customer ledger
// @route   GET /api/customers/:id/ledger
// @access  Private
export const getCustomerLedger = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Get all bills and payments for the customer
    const bills = await Bill.find({ customer: req.params.id })
      .sort({ createdAt: -1 });
    const payments = await Payment.find({ customer: req.params.id })
      .sort({ createdAt: -1 });

    // Combine and sort transactions
    const transactions = [
      ...bills.map(bill => ({
        type: 'purchase',
        date: bill.createdAt,
        reference: bill.billNumber,
        description: 'Purchase',
        amount: bill.totalAmount,
        balance: bill.remainingDue
      })),
      ...payments.map(payment => ({
        type: 'payment',
        date: payment.createdAt,
        reference: payment.paymentNumber,
        description: 'Payment',
        amount: payment.amount,
        balance: payment.balanceAfter
      }))
    ].sort((a, b) => b.date - a.date);

    res.json({
      customer,
      transactions
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Record customer payment
// @route   POST /api/customers/:id/payment
// @access  Private/Admin
export const recordPayment = async (req, res) => {
  try {
    const { amount, paymentMethod, notes, recordedBy } = req.body;
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    if (amount > customer.totalDue) {
      return res.status(400).json({ 
        message: 'Payment amount cannot exceed total due' 
      });
    }

    // Create new payment instance
    const payment = new Payment({
      customer: customer._id,
      amount,
      paymentMethod,
      notes,
      balanceAfter: customer.totalDue - amount,
      recordedBy
    });

    // Save payment and wait for pre-save hook to complete
    await payment.save();

    // Update customer's financial data
    await customer.updateFinancials(amount, 'payment');

    // Update associated bills
    let remainingAmount = amount;
    const unpaidBills = await Bill.find({
      customer: customer._id,
      dueAmount: { $gt: 0 }
    }).sort({ date: 1 }); // Sort by date to pay oldest bills first

    for (const bill of unpaidBills) {
      if (remainingAmount <= 0) break;

      const paymentAmount = Math.min(remainingAmount, bill.dueAmount);
      bill.paidAmount += paymentAmount;
      bill.dueAmount -= paymentAmount;
      bill.status = bill.dueAmount > 0 ? 'pending' : 'paid';
      bill.paymentStatus = bill.dueAmount > 0 ? 'partial' : 'paid';
      
      await bill.save();
      remainingAmount -= paymentAmount;
    }

    res.status(201).json({
      payment,
      customer: await Customer.findById(customer._id)
    });
  } catch (error) {
    console.error('Payment recording error:', error);
    res.status(500).json({ 
      message: error.message || 'Server error',
      details: error.errors || {}
    });
  }
};

// @desc    Get customers with dues
// @route   GET /api/customers/dues
// @access  Private
export const getCustomersWithDues = async (req, res) => {
  try {
    const customers = await Customer.find({
      isActive: true,
      totalDue: { $gt: 0 }
    }).sort({ totalDue: -1 });

    res.json(customers);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get customer statistics
// @route   GET /api/customers/stats
// @access  Private
export const getCustomerStats = async (req, res) => {
  try {
    const totalCustomers = await Customer.countDocuments({ isActive: true });
    const customersWithDues = await Customer.countDocuments({
      isActive: true,
      totalDue: { $gt: 0 }
    });
    const totalDues = await Customer.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: null, total: { $sum: '$totalDue' } } }
    ]);

    res.json({
      totalCustomers,
      customersWithDues,
      totalDues: totalDues[0]?.total || 0
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}; 