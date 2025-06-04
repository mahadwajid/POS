import express from 'express';
import Customer from '../Models/Customer.js';
import { auth } from '../Middlewares/auth.js';

const router = express.Router();

// Get all customers
router.get('/', auth, async (req, res) => {
  try {
    const { search, sortBy = 'name', sortOrder = 'asc' } = req.query;
    
    let query = { isActive: true };
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    const customers = await Customer.find(query).sort(sort);
    res.json(customers);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get customer by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    res.json(customer);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new customer
router.post('/', auth, async (req, res) => {
  try {
    const {
      name,
      phone,
      email,
      address,
      creditLimit,
      notes
    } = req.body;

    // Check if phone number already exists
    const existingCustomer = await Customer.findOne({ phone });
    if (existingCustomer) {
      return res.status(400).json({ message: 'Phone number already registered' });
    }

    const customer = new Customer({
      name,
      phone,
      email,
      address,
      creditLimit,
      notes
    });

    await customer.save();
    res.status(201).json(customer);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update customer
router.put('/:id', auth, async (req, res) => {
  try {
    const {
      name,
      phone,
      email,
      address,
      creditLimit,
      notes,
      isActive
    } = req.body;

    // Check if phone number already exists for other customers
    if (phone) {
      const existingCustomer = await Customer.findOne({
        phone,
        _id: { $ne: req.params.id }
      });
      if (existingCustomer) {
        return res.status(400).json({ message: 'Phone number already registered' });
      }
    }

    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      {
        name,
        phone,
        email,
        address,
        creditLimit,
        notes,
        isActive
      },
      { new: true }
    );

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    res.json(customer);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete customer
router.delete('/:id', auth, async (req, res) => {
  try {
    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get customers with dues
router.get('/dues/active', auth, async (req, res) => {
  try {
    const customers = await Customer.find({
      isActive: true,
      totalDue: { $gt: 0 }
    }).sort({ totalDue: -1 });
    res.json(customers);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router; 