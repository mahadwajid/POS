import express from 'express';
import { Product } from '../Models/index.js';
import Bill from '../Models/Bill.js';
import Customer from '../Models/Customer.js';
import { auth } from '../Middlewares/auth.js';

const router = express.Router();

// Get all bills
router.get('/', auth, async (req, res) => {
  try {
    const { startDate, endDate, customer, status, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    
    let query = {};
    
    if (startDate && endDate) {
      query.createdAt = {
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
    
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    const bills = await Bill.find(query)
      .populate('customer', 'name phone')
      .populate('items.product', 'name sku price')
      .sort(sort);
    
    res.json(bills);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get bill by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id)
      .populate('customer', 'name phone email address')
      .populate('items.product', 'name sku price costPrice')
      .populate('createdBy', 'username fullName');
      
    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }
    res.json(bill);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new bill
router.post('/', auth, async (req, res) => {
  try {
    const {
      customer,
      items,
      subtotal,
      tax,
      discount,
      total,
      paidAmount,
      paymentMethod,
      notes
    } = req.body;

    // Generate bill number
    const date = new Date();
    const billNumber = `BILL-${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

    // Calculate due amount
    const dueAmount = total - paidAmount;

    // Determine bill status
    let status;
    if (dueAmount <= 0) {
      status = 'Paid';
    } else if (paidAmount > 0) {
      status = 'Partially Paid';
    } else {
      status = 'Unpaid';
    }

    // Create bill
    const bill = new Bill({
      billNumber,
      customer,
      items,
      subtotal,
      tax,
      discount,
      total,
      paidAmount,
      dueAmount,
      paymentMethod,
      status,
      notes,
      createdBy: req.user._id
    });

    // Update product quantities
    for (const item of items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { quantity: -item.quantity }
      });
    }

    // Update customer's total due
    await Customer.findByIdAndUpdate(customer, {
      $inc: { totalDue: dueAmount },
      lastPurchase: new Date()
    });

    await bill.save();
    
    const populatedBill = await Bill.findById(bill._id)
      .populate('customer', 'name phone')
      .populate('items.product', 'name sku price');
    
    res.status(201).json(populatedBill);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update bill payment
router.put('/:id/payment', auth, async (req, res) => {
  try {
    const { paidAmount, paymentMethod } = req.body;
    
    const bill = await Bill.findById(req.params.id);
    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }

    const newPaidAmount = bill.paidAmount + paidAmount;
    const newDueAmount = bill.total - newPaidAmount;
    
    let status;
    if (newDueAmount <= 0) {
      status = 'Paid';
    } else if (newPaidAmount > 0) {
      status = 'Partially Paid';
    } else {
      status = 'Unpaid';
    }

    // Update bill
    bill.paidAmount = newPaidAmount;
    bill.dueAmount = newDueAmount;
    bill.status = status;
    bill.paymentMethod = paymentMethod;
    await bill.save();

    // Update customer's total due
    await Customer.findByIdAndUpdate(bill.customer, {
      $inc: { totalDue: -paidAmount }
    });

    res.json(bill);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get today's sales summary
router.get('/summary/today', auth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const summary = await Bill.aggregate([
      {
        $match: {
          createdAt: {
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
});

export default router; 