import Customer from '../models/Customer.js';
import Bill from '../models/Bill.js';

// @desc    Get all customers
// @route   GET /api/customers
// @access  Private
export const getCustomers = async (req, res) => {
  try {
    const { search } = req.query;
    const query = { isActive: true };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
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
// @access  Private
export const createCustomer = async (req, res) => {
  try {
    const { name, phone, email, address, creditLimit, notes } = req.body;

    // Check if phone number exists
    const phoneExists = await Customer.findOne({ phone });
    if (phoneExists) {
      return res.status(400).json({ message: 'Phone number already exists' });
    }

    const customer = await Customer.create({
      name,
      phone,
      email,
      address,
      creditLimit,
      notes
    });

    res.status(201).json(customer);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update customer
// @route   PUT /api/customers/:id
// @access  Private
export const updateCustomer = async (req, res) => {
  try {
    const { name, phone, email, address, creditLimit, notes, isActive } = req.body;

    // Check if customer exists
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Check if phone number is taken by another customer
    if (phone !== customer.phone) {
      const phoneExists = await Customer.findOne({ phone });
      if (phoneExists) {
        return res.status(400).json({ message: 'Phone number already exists' });
      }
    }

    // Update customer
    Object.assign(customer, {
      name,
      phone,
      email,
      address,
      creditLimit,
      notes,
      isActive
    });

    await customer.save();
    res.json(customer);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete customer
// @route   DELETE /api/customers/:id
// @access  Private
export const deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Check if customer has any bills
    const hasBills = await Bill.exists({ customer: req.params.id });
    if (hasBills) {
      return res.status(400).json({ message: 'Cannot delete customer with existing bills' });
    }

    // Soft delete
    customer.isActive = false;
    await customer.save();

    res.json({ message: 'Customer deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
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