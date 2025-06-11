import { Product } from '../Models/index.js';
import { Bill } from '../Models/index.js';
import { Customer } from '../Models/index.js';
import mongoose from 'mongoose';

// @desc    Get all bills
// @route   GET /api/bills
// @access  Private
export const getBills = async (req, res) => {
  try {
    const bills = await Bill.find()
      .populate('customer', 'name phone')
      .populate('items.product', 'name sku price')
      .sort({ createdAt: -1 });

    res.json(bills);
  } catch (error) {
    console.error('Bills fetch error:', error);
    res.status(500).json({ 
      message: 'Server error',
      details: error.message 
    });
  }
};

// @desc    Get bill by ID
// @route   GET /api/bills/:id
// @access  Private
export const getBillById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid bill ID format' });
    }

    const bill = await Bill.findById(id)
      .populate('customer', 'name phone')
      .populate('items.product', 'name sku price');

    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }

    res.json(bill);
  } catch (error) {
    console.error('Bill fetch error:', error);
    res.status(500).json({ 
      message: 'Server error',
      details: error.message 
    });
  }
};

// @desc    Create new bill
// @route   POST /api/bills
// @access  Private
export const createBill = async (req, res) => {
  try {
    const {
      customer,
      items,
      subtotal,
      tax = 0,
      discount = 0,
      total,
      paymentMethod,
      paymentStatus,
      notes,
      status,
      type,
      reference,
      date,
      dueDate,
      shippingAddress,
      billingAddress,
      shippingMethod,
      shippingCost,
      handlingCost,
      insuranceCost,
      currency,
      exchangeRate,
      attachments,
      tags,
      metadata
    } = req.body;

    // Validate required fields
    if (!customer || !items || !items.length || !subtotal || !total || !paymentMethod) {
      return res.status(400).json({ 
        message: 'Missing required fields',
        required: ['customer', 'items', 'subtotal', 'total', 'paymentMethod']
      });
    }

    // Validate items
    for (const item of items) {
      if (!item.product || !item.quantity || !item.price) {
        return res.status(400).json({ 
          message: 'Invalid item data',
          required: ['product', 'quantity', 'price']
        });
      }
    }

    // Generate bill number
    const lastBill = await Bill.findOne().sort({ billNumber: -1 });
    const billNumber = lastBill ? `BILL-${parseInt(lastBill.billNumber.split('-')[1]) + 1}` : 'BILL-1001';

    // Calculate payment amounts
    const paidAmount = paymentStatus === 'paid' ? total : 0;
    const dueAmount = total - paidAmount;

    // Normalize payment method and status
    const normalizedPaymentMethod = paymentMethod.toLowerCase();
    const normalizedStatus = status ? status.toLowerCase() : 'pending';

    // Validate payment method
    const validPaymentMethods = ['cash', 'card', 'bank_transfer', 'upi', 'wallet', 'cheque', 'credit'];
    if (!validPaymentMethods.includes(normalizedPaymentMethod)) {
      return res.status(400).json({ 
        message: 'Invalid payment method',
        validMethods: validPaymentMethods
      });
    }

    // Validate status
    const validStatuses = ['pending', 'processing', 'completed', 'cancelled', 'refunded', 'paid'];
    if (!validStatuses.includes(normalizedStatus)) {
      return res.status(400).json({ 
        message: 'Invalid status',
        validStatuses: validStatuses
      });
    }

    // Create bill
    const bill = await Bill.create({
      billNumber,
      customer,
      items: items.map(item => ({
        product: item.product,
        quantity: item.quantity,
        price: item.price,
        discount: item.discount || 0,
        tax: item.tax || 0,
        total: item.total || (item.price * item.quantity)
      })),
      subtotal,
      tax,
      discount,
      total,
      paidAmount,
      dueAmount,
      paymentMethod: normalizedPaymentMethod,
      paymentStatus: paymentStatus || 'pending',
      notes,
      status: normalizedStatus,
      type: type || 'sale',
      reference: reference || `BILL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      date: date || new Date(),
      dueDate,
      shippingAddress,
      billingAddress,
      shippingMethod,
      shippingCost: shippingCost || 0,
      handlingCost: handlingCost || 0,
      insuranceCost: insuranceCost || 0,
      currency: currency || 'USD',
      exchangeRate: exchangeRate || 1,
      attachments,
      tags,
      metadata,
      createdBy: req.user._id
    });

    // Update product quantities
    for (const item of items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { quantity: -item.quantity }
      });
    }

    // Update customer's total due
    console.log('DEBUG: About to update customer totalDue', { customer, total, paymentStatus });
    if (paymentStatus === 'pending' || paymentStatus === 'partial') {
      const updateResult = await Customer.findByIdAndUpdate(customer, {
        $inc: { totalDue: total }
      }, { new: true });
      console.log('DEBUG: Customer totalDue update result:', updateResult);
    } else {
      console.log('DEBUG: No customer totalDue update needed for paymentStatus:', paymentStatus);
    }

    // Populate bill details
    const populatedBill = await Bill.findById(bill._id)
      .populate('customer', 'name phone')
      .populate('items.product', 'name sku price');

    res.status(201).json(populatedBill);
  } catch (error) {
    console.error('Bill creation error:', error);
    res.status(500).json({ 
      message: 'Server error',
      details: error.message 
    });
  }
};

// @desc    Update bill payment
// @route   PUT /api/bills/:id/payment
// @access  Private
export const updateBillPayment = async (req, res) => {
  try {
    const { paidAmount, paymentMethod } = req.body;

    const bill = await Bill.findById(req.params.id);
    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }

    // Calculate new due amount
    const newPaidAmount = bill.paidAmount + paidAmount;
    const newDueAmount = bill.total - newPaidAmount;

    // Update bill
    bill.paidAmount = newPaidAmount;
    bill.dueAmount = newDueAmount;
    bill.paymentMethod = paymentMethod;
    bill.status = newDueAmount > 0 ? 'partial' : 'paid';
    bill.payments.push({
      amount: paidAmount,
      method: paymentMethod,
      date: new Date()
    });

    await bill.save();

    // Update customer's total due
    const dueDifference = bill.dueAmount - newDueAmount;
    if (dueDifference !== 0) {
      await Customer.findByIdAndUpdate(bill.customer, {
        $inc: { totalDue: -dueDifference }
      });
    }

    // Populate bill details
    const populatedBill = await Bill.findById(bill._id)
      .populate('customer', 'name phone')
      .populate('items.product', 'name sku price');

    res.json(populatedBill);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get today's sales summary
// @route   GET /api/bills/summary/today
// @access  Private
export const getTodaySummary = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const bills = await Bill.find({
      createdAt: { $gte: today, $lt: tomorrow }
    });

    const summary = {
      totalSales: bills.reduce((sum, bill) => sum + bill.total, 0),
      totalPaid: bills.reduce((sum, bill) => sum + bill.paidAmount, 0),
      totalDue: bills.reduce((sum, bill) => sum + bill.dueAmount, 0),
      count: bills.length
    };

    res.json(summary);
  } catch (error) {
    console.error('Today summary error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get weekly sales summary
// @route   GET /api/bills/summary/weekly
// @access  Private
export const getWeeklySummary = async (req, res) => {
  try {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const bills = await Bill.find({
      createdAt: { $gte: startOfWeek }
    });

    const dailySummary = Array(7).fill().map((_, index) => {
      const date = new Date(startOfWeek);
      date.setDate(date.getDate() + index);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const dayBills = bills.filter(bill => 
        bill.createdAt >= date && bill.createdAt < nextDate
      );

      return {
        _id: date.toISOString().split('T')[0],
        amount: dayBills.reduce((sum, bill) => sum + bill.total, 0),
        count: dayBills.length
      };
    });

    res.json(dailySummary);
  } catch (error) {
    console.error('Weekly summary error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get monthly sales summary
// @route   GET /api/bills/summary/monthly
// @access  Private
export const getMonthlySummary = async (req, res) => {
  try {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const bills = await Bill.find({
      createdAt: { $gte: startOfMonth, $lte: endOfMonth }
    });

    const dailySummary = Array(endOfMonth.getDate()).fill().map((_, index) => {
      const date = new Date(startOfMonth);
      date.setDate(date.getDate() + index);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const dayBills = bills.filter(bill => 
        bill.createdAt >= date && bill.createdAt < nextDate
      );

      return {
        _id: date.toISOString().split('T')[0],
        amount: dayBills.reduce((sum, bill) => sum + bill.total, 0),
        count: dayBills.length
      };
    });

    res.json(dailySummary);
  } catch (error) {
    console.error('Monthly summary error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get category-wise sales summary
// @route   GET /api/bills/summary/category
// @access  Private
export const getCategorySummary = async (req, res) => {
  try {
    const bills = await Bill.find()
      .populate('items.product', 'category');

    const categorySummary = bills.reduce((summary, bill) => {
      bill.items.forEach(item => {
        const category = item.product.category || 'Uncategorized';
        if (!summary[category]) {
          summary[category] = {
            _id: category,
            amount: 0,
            count: 0
          };
        }
        summary[category].amount += item.price * item.quantity;
        summary[category].count += item.quantity;
      });
      return summary;
    }, {});

    res.json(Object.values(categorySummary));
  } catch (error) {
    console.error('Category summary error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete bill
// @route   DELETE /api/bills/:id
// @access  Private/Admin
export const deleteBill = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid bill ID format' });
    }

    const bill = await Bill.findByIdAndDelete(id);

    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }

    // Restore product quantities
    for (const item of bill.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { quantity: item.quantity }
      });
    }

    // Update customer's total due
    if (bill.paymentStatus === 'pending' || bill.paymentStatus === 'partial') {
      await Customer.findByIdAndUpdate(bill.customer, {
        $inc: { totalDue: -bill.total }
      });
    }

    res.json({ message: 'Bill deleted successfully' });
  } catch (error) {
    console.error('Bill deletion error:', error);
    res.status(500).json({ 
      message: 'Server error',
      details: error.message 
    });
  }
};

export const updateBill = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid bill ID format' });
    }

    // Find and update bill
    const bill = await Bill.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate('customer', 'name phone')
     .populate('items.product', 'name sku price');

    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }

    res.json(bill);
  } catch (error) {
    console.error('Bill update error:', error);
    res.status(500).json({ 
      message: 'Server error',
      details: error.message 
    });
  }
}; 