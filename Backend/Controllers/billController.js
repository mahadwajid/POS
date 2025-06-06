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
      status: dueAmount > 0 ? 'partial' : 'paid'
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
    res.status(500).json({ message: 'Server error' });
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
export const getTodaySalesSummary = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const summary = await Bill.aggregate([
      {
        $match: {
          date: {
            $gte: today,
            $lt: tomorrow
          }
        }
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$total' },
          totalPaid: { $sum: '$paidAmount' },
          totalDue: { $sum: '$dueAmount' },
          count: { $sum: 1 }
        }
      }
    ]);

    res.json(summary[0] || {
      totalSales: 0,
      totalPaid: 0,
      totalDue: 0,
      count: 0
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get weekly sales summary
// @route   GET /api/bills/summary/weekly
// @access  Private
export const getWeeklySalesSummary = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);

    const summary = await Bill.aggregate([
      {
        $match: {
          date: {
            $gte: lastWeek,
            $lte: today
          }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          total: { $sum: '$total' },
          paid: { $sum: '$paidAmount' }
        }
      },
      {
        $project: {
          _id: 0,
          date: '$_id',
          total: 1,
          paid: 1
        }
      },
      { $sort: { date: 1 } }
    ]);

    res.json(summary);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get monthly sales summary
// @route   GET /api/bills/summary/monthly
// @access  Private
export const getMonthlySalesSummary = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastMonth = new Date(today);
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const summary = await Bill.aggregate([
      {
        $match: {
          date: {
            $gte: lastMonth,
            $lte: today
          }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$date' } },
          total: { $sum: '$total' },
          paid: { $sum: '$paidAmount' }
        }
      },
      {
        $project: {
          _id: 0,
          month: '$_id',
          total: 1,
          paid: 1
        }
      },
      { $sort: { month: 1 } }
    ]);

    res.json(summary);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get category-wise sales summary
// @route   GET /api/bills/summary/category
// @access  Private
export const getCategorySalesSummary = async (req, res) => {
  try {
    const summary = await Bill.aggregate([
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $group: {
          _id: '$product.category',
          total: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
        }
      },
      {
        $project: {
          _id: 0,
          category: '$_id',
          total: 1
        }
      }
    ]);

    res.json(summary);
  } catch (error) {
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