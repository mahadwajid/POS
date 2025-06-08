import { Product } from '../Models/index.js';
import { Bill } from '../Models/index.js';
import { Customer } from '../Models/index.js';

// @desc    Get all bills
// @route   GET /api/bills
// @access  Private
export const getBills = async (req, res) => {
  try {
    const { startDate, endDate, customer, status, sort } = req.query;
    const query = {};

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    if (customer) {
      query.customer = customer;
    }

    if (status) {
      query.status = status;
    }

    let sortOption = { date: -1 };
    if (sort) {
      const [field, order] = sort.split(':');
      sortOption = { [field]: order === 'desc' ? -1 : 1 };
    }

    const bills = await Bill.find(query)
      .populate('customer', 'name phone')
      .populate('items.product', 'name sku price')
      .sort(sortOption);

    res.json(bills);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get bill by ID
// @route   GET /api/bills/:id
// @access  Private
export const getBillById = async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id)
      .populate('customer', 'name phone')
      .populate('items.product', 'name sku price');

    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }

    res.json(bill);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
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
      tax,
      total,
      paidAmount,
      paymentMethod,
      notes
    } = req.body;

    // Generate bill number
    const lastBill = await Bill.findOne().sort({ billNumber: -1 });
    const billNumber = lastBill ? lastBill.billNumber + 1 : 1001;

    // Calculate due amount
    const dueAmount = total - paidAmount;

    // Create bill
    const bill = await Bill.create({
      billNumber,
      customer,
      items,
      subtotal,
      tax,
      total,
      paidAmount,
      dueAmount,
      paymentMethod,
      notes,
      status: dueAmount > 0 ? 'Partially Paid' : 'Paid',
      createdBy: req.user._id
    });

    // Update product quantities
    for (const item of items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { quantity: -item.quantity }
      });
    }

    // Update customer's total due
    if (dueAmount > 0) {
      await Customer.findByIdAndUpdate(customer, {
        $inc: { totalDue: dueAmount }
      });
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
    const bill = await Bill.findById(req.params.id);
    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }

    // Check if bill is already paid
    if (bill.status === 'paid') {
      return res.status(400).json({ 
        message: 'Cannot delete a paid bill'
      });
    }

    // Restore product quantities
    for (const item of bill.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { quantity: item.quantity }
      });
    }

    // Update customer's total due
    if (bill.dueAmount > 0) {
      await Customer.findByIdAndUpdate(bill.customer, {
        $inc: { totalDue: -bill.dueAmount }
      });
    }

    // Delete the bill
    await Bill.findByIdAndDelete(bill._id);

    res.json({ 
      message: 'Bill deleted successfully',
      bill: {
        id: bill._id,
        billNumber: bill.billNumber,
        total: bill.total
      }
    });
  } catch (error) {
    console.error('Bill deletion error:', error);
    res.status(500).json({ 
      message: 'Server error',
      details: error.message
    });
  }
}; 