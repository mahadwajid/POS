import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../Models/User.js';
import Customer from '../Models/Customer.js';
import Product from '../Models/Product.js';
import Bill from '../Models/Bill.js';
import Expense from '../Models/Expense.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });

// Test data arrays
const categories = ['Lighting', 'Switches', 'Cables', 'Tools', 'Accessories', 'Other'];
const unitTypes = ['piece', 'meter', 'box', 'set', 'kg'];
const paymentMethods = ['Cash', 'Card', 'UPI', 'Bank Transfer', 'Credit'];
const cities = ['Karachi', 'Lahore', 'Islamabad', 'Faisalabad', 'Peshawar'];

// Helper functions
const getRandomNumber = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomDate = (start, end) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
const getRandomItem = (array) => array[Math.floor(Math.random() * array.length)];

// Generate test users
async function generateUsers(count) {
    console.log(`Generating ${count} users...`);
    const users = [];
    const roles = ['super_admin', 'sub_admin'];

    for (let i = 0; i < count; i++) {
        const hashedPassword = await bcrypt.hash('Test@123', 10);
        users.push({
            name: `Test User ${i + 1}`,
            email: `user${i + 1}@test.com`,
            password: hashedPassword,
            role: getRandomItem(roles),
            isActive: true
        });
    }

    await User.insertMany(users);
    console.log('Users generated successfully');
    return users;
}

// Generate test customers
async function generateCustomers(count) {
    console.log(`Generating ${count} customers...`);
    const customers = [];

    for (let i = 0; i < count; i++) {
        customers.push({
            name: `Test Customer ${i + 1}`,
            phone: `0300${String(i + 1).padStart(7, '0')}`,
            email: `customer${i + 1}@test.com`,
            address: {
                street: `${i + 1} Test Street`,
                city: getRandomItem(cities),
                state: 'Test State',
                pincode: '12345'
            },
            creditLimit: getRandomNumber(5000, 50000),
            totalDue: 0,
            isActive: true
        });
    }

    await Customer.insertMany(customers);
    console.log('Customers generated successfully');
    return customers;
}

// Generate test products
async function generateProducts(count) {
    console.log(`Generating ${count} products...`);
    const products = [];

    for (let i = 0; i < count; i++) {
        const price = getRandomNumber(100, 10000);
        products.push({
            name: `Test Product ${i + 1}`,
            description: `Description for product ${i + 1}`,
            category: getRandomItem(categories),
            price: price,
            costPrice: price * 0.8,
            quantity: getRandomNumber(0, 100),
            unitType: getRandomItem(unitTypes),
            sku: `SKU${String(i + 1).padStart(3, '0')}`,
            brand: `Test Brand ${i + 1}`,
            model: `Model ${i + 1}`,
            warranty: getRandomNumber(0, 24), // warranty in months
            lowStockAlert: 10,
            isActive: true
        });
    }

    await Product.insertMany(products);
    console.log('Products generated successfully');
    return products;
}

// Generate test bills
async function generateBills(count, customers, products, users) {
    console.log(`Generating ${count} bills...`);
    const bills = [];
    const statuses = ['Paid', 'Partially Paid', 'Unpaid'];
    const paymentMethods = ['Cash', 'Card', 'UPI', 'Bank Transfer', 'Credit'];

    // Ensure we have valid references
    if (!customers.length || !products.length || !users.length) {
        throw new Error('Missing required references for bill generation');
    }

    // Get all saved documents from the database
    const savedCustomers = await Customer.find({});
    const savedProducts = await Product.find({});
    const savedUsers = await User.find({});

    if (!savedCustomers.length || !savedProducts.length || !savedUsers.length) {
        throw new Error('Failed to retrieve saved documents from database');
    }

    for (let i = 0; i < count; i++) {
        try {
            // Generate 1-3 random items for each bill
            const numItems = getRandomNumber(1, 3);
            const items = [];
            let subtotal = 0;

            // Select random customer and creator from saved documents
            const customer = getRandomItem(savedCustomers);
            const creator = getRandomItem(savedUsers);

            if (!customer || !creator) {
                throw new Error('Failed to get valid customer or creator');
            }

            for (let j = 0; j < numItems; j++) {
                const product = getRandomItem(savedProducts);
                if (!product) {
                    throw new Error('Failed to get valid product');
                }

                const quantity = getRandomNumber(1, 5);
                const price = product.price;
                const total = price * quantity;
                subtotal += total;

                items.push({
                    product: product._id,
                    quantity: quantity,
                    price: price,
                    total: total
                });
            }

            const tax = subtotal * 0.15; // 15% tax
            const discount = getRandomNumber(0, subtotal * 0.1); // Random discount up to 10%
            const total = subtotal + tax - discount;
            const paidAmount = getRandomNumber(0, total);
            const dueAmount = total - paidAmount;
            const status = dueAmount === 0 ? 'Paid' : dueAmount === total ? 'Unpaid' : 'Partially Paid';

            const bill = {
                billNumber: `BILL${String(i + 1).padStart(6, '0')}`,
                customer: customer._id,
                items: items,
                subtotal: subtotal,
                tax: tax,
                discount: discount,
                total: total,
                paidAmount: paidAmount,
                dueAmount: dueAmount,
                paymentMethod: getRandomItem(paymentMethods),
                status: status,
                createdBy: creator._id,
                notes: `Test bill ${i + 1}`
            };

            bills.push(bill);
        } catch (error) {
            console.error(`Error generating bill ${i + 1}:`, error);
            throw error;
        }
    }

    try {
        await Bill.insertMany(bills);
        console.log('Bills generated successfully');
        return bills;
    } catch (error) {
        console.error('Error inserting bills:', error);
        throw error;
    }
}

// Generate test expenses
async function generateExpenses(count, users) {
    console.log(`Generating ${count} expenses...`);
    const expenses = [];
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 1);
    const endDate = new Date();

    // Get all saved users from the database
    const savedUsers = await User.find({});
    if (!savedUsers.length) {
        throw new Error('Failed to retrieve saved users from database');
    }

    // Valid expense categories and payment methods from the model
    const expenseCategories = ['Rent', 'Utilities', 'Salary', 'Marketing', 'Maintenance', 'Office Supplies', 'Travel', 'Misc'];
    const expensePaymentMethods = ['cash', 'card', 'bank', 'upi'];

    for (let i = 0; i < count; i++) {
        const creator = getRandomItem(savedUsers);
        if (!creator) {
            throw new Error('Failed to get valid creator for expense');
        }

        expenses.push({
            title: `Test Expense ${i + 1}`,
            category: getRandomItem(expenseCategories),
            amount: getRandomNumber(100, 10000),
            paymentMethod: getRandomItem(expensePaymentMethods),
            date: getRandomDate(startDate, endDate),
            description: `Description for expense ${i + 1}`,
            createdBy: creator._id,
            isRecurring: Math.random() > 0.8, // 20% chance of being recurring
            recurringDetails: Math.random() > 0.8 ? {
                frequency: getRandomItem(['Daily', 'Weekly', 'Monthly', 'Yearly']),
                nextDueDate: new Date(endDate.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
            } : undefined
        });
    }

    try {
        await Expense.insertMany(expenses);
        console.log('Expenses generated successfully');
        return expenses;
    } catch (error) {
        console.error('Error inserting expenses:', error);
        throw error;
    }
}

// Main function to generate all test data
async function generateTestData() {
    try {
        console.log('Connected to MongoDB');
        
        // Clear existing data
        await Promise.all([
            User.deleteMany({}),
            Customer.deleteMany({}),
            Product.deleteMany({}),
            Bill.deleteMany({}),
            Expense.deleteMany({})
        ]);
        console.log('Cleared existing data');

        // Generate test data in sequence
        const users = await generateUsers(50);
        console.log('Users generated successfully');
        
        const customers = await generateCustomers(50);
        console.log('Customers generated successfully');
        
        const products = await generateProducts(100);
        console.log('Products generated successfully');
        
        // Ensure we have the data before generating bills
        if (!users.length || !customers.length || !products.length) {
            throw new Error('Failed to generate required data for bills');
        }

        // Generate bills with the created data
        await generateBills(200, customers, products, users);
        console.log('Bills generated successfully');
        
        await generateExpenses(100, users);
        console.log('Expenses generated successfully');

        console.log('All test data generated successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error generating test data:', error);
        process.exit(1);
    }
}

// Run the main function
generateTestData(); 