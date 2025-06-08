const request = require('supertest');
const app = require('../Server');
const User = require('../Models/User');
const Bill = require('../Models/Bill');
const Customer = require('../Models/Customer');
const Product = require('../Models/Product');
const bcrypt = require('bcryptjs');

describe('Reports Tests', () => {
    let token;
    let testUser;
    let testCustomer;
    let testProduct;

    beforeEach(async () => {
        // Create test user
        const hashedPassword = await bcrypt.hash('Test@123', 10);
        testUser = await User.create({
            name: 'Test User',
            email: 'test@example.com',
            password: hashedPassword,
            role: 'super_admin',
            isActive: true
        });

        // Login to get token
        const loginRes = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'test@example.com',
                password: 'Test@123'
            });
        token = loginRes.body.token;

        // Create test customer
        testCustomer = await Customer.create({
            name: 'Test Customer',
            phone: '03001234567',
            email: 'customer@test.com',
            address: {
                street: '123 Test St',
                city: 'Test City',
                state: 'Test State',
                pincode: '12345'
            },
            creditLimit: 10000,
            totalDue: 0,
            isActive: true
        });

        // Create test product
        testProduct = await Product.create({
            name: 'Test Product',
            description: 'Test Description',
            category: 'Electronics',
            price: 1000,
            costPrice: 800,
            quantity: 50,
            unitType: 'piece',
            sku: 'TEST001',
            brand: 'Test Brand',
            model: 'Test Model',
            warranty: '1 year',
            lowStockAlert: 10,
            isActive: true
        });
    });

    describe('GET /api/reports/sales', () => {
        beforeEach(async () => {
            // Create test bills with different dates
            const today = new Date();
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const lastMonth = new Date();
            lastMonth.setMonth(lastMonth.getMonth() - 1);

            await Bill.create([
                {
                    customer: testCustomer._id,
                    items: [{
                        product: testProduct._id,
                        quantity: 2,
                        price: 1000,
                        total: 2000
                    }],
                    subtotal: 2000,
                    tax: 200,
                    total: 2200,
                    paid: 2200,
                    due: 0,
                    status: 'paid',
                    paymentMethod: 'Cash',
                    date: today,
                    createdBy: testUser._id
                },
                {
                    customer: testCustomer._id,
                    items: [{
                        product: testProduct._id,
                        quantity: 1,
                        price: 1000,
                        total: 1000
                    }],
                    subtotal: 1000,
                    tax: 100,
                    total: 1100,
                    paid: 500,
                    due: 600,
                    status: 'partial',
                    paymentMethod: 'Cash',
                    date: yesterday,
                    createdBy: testUser._id
                },
                {
                    customer: testCustomer._id,
                    items: [{
                        product: testProduct._id,
                        quantity: 3,
                        price: 1000,
                        total: 3000
                    }],
                    subtotal: 3000,
                    tax: 300,
                    total: 3300,
                    paid: 3300,
                    due: 0,
                    status: 'paid',
                    paymentMethod: 'Bank Transfer',
                    date: lastMonth,
                    createdBy: testUser._id
                }
            ]);
        });

        it('should get today\'s sales report', async () => {
            const res = await request(app)
                .get('/api/reports/sales?period=today')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('totalSales');
            expect(res.body).toHaveProperty('totalPaid');
            expect(res.body).toHaveProperty('totalDue');
            expect(res.body.totalSales).toBe(2200);
            expect(res.body.totalPaid).toBe(2200);
            expect(res.body.totalDue).toBe(0);
        });

        it('should get weekly sales report', async () => {
            const res = await request(app)
                .get('/api/reports/sales?period=week')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('totalSales');
            expect(res.body).toHaveProperty('totalPaid');
            expect(res.body).toHaveProperty('totalDue');
            expect(res.body.totalSales).toBe(3300); // 2200 + 1100
            expect(res.body.totalPaid).toBe(2700); // 2200 + 500
            expect(res.body.totalDue).toBe(600);
        });

        it('should get monthly sales report', async () => {
            const res = await request(app)
                .get('/api/reports/sales?period=month')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('totalSales');
            expect(res.body).toHaveProperty('totalPaid');
            expect(res.body).toHaveProperty('totalDue');
            expect(res.body.totalSales).toBe(3300); // Only today and yesterday
            expect(res.body.totalPaid).toBe(2700);
            expect(res.body.totalDue).toBe(600);
        });

        it('should get sales report by date range', async () => {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - 2);
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + 1);

            const res = await request(app)
                .get(`/api/reports/sales?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`)
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('totalSales');
            expect(res.body).toHaveProperty('totalPaid');
            expect(res.body).toHaveProperty('totalDue');
            expect(res.body.totalSales).toBe(3300); // All bills
            expect(res.body.totalPaid).toBe(6000); // 2200 + 500 + 3300
            expect(res.body.totalDue).toBe(600);
        });
    });

    describe('GET /api/reports/inventory', () => {
        beforeEach(async () => {
            // Create more test products
            await Product.create([
                {
                    name: 'Product 1',
                    category: 'Electronics',
                    price: 2000,
                    costPrice: 1500,
                    quantity: 20,
                    unitType: 'piece',
                    sku: 'TEST002',
                    isActive: true
                },
                {
                    name: 'Product 2',
                    category: 'Clothing',
                    price: 500,
                    costPrice: 300,
                    quantity: 5,
                    unitType: 'piece',
                    sku: 'TEST003',
                    lowStockAlert: 10,
                    isActive: true
                }
            ]);
        });

        it('should get inventory report', async () => {
            const res = await request(app)
                .get('/api/reports/inventory')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('totalProducts');
            expect(res.body).toHaveProperty('totalValue');
            expect(res.body).toHaveProperty('lowStockItems');
            expect(res.body.totalProducts).toBe(3);
            expect(Array.isArray(res.body.lowStockItems)).toBe(true);
            expect(res.body.lowStockItems).toHaveLength(1);
        });

        it('should get inventory report by category', async () => {
            const res = await request(app)
                .get('/api/reports/inventory?category=Electronics')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('totalProducts');
            expect(res.body).toHaveProperty('totalValue');
            expect(res.body.totalProducts).toBe(2);
        });
    });

    describe('GET /api/reports/customers', () => {
        beforeEach(async () => {
            // Create more test customers
            await Customer.create([
                {
                    name: 'Customer 1',
                    phone: '03001111111',
                    email: 'customer1@test.com',
                    address: {
                        street: '123 Test St',
                        city: 'Test City',
                        state: 'Test State',
                        pincode: '12345'
                    },
                    creditLimit: 5000,
                    totalDue: 2000,
                    isActive: true
                },
                {
                    name: 'Customer 2',
                    phone: '03002222222',
                    email: 'customer2@test.com',
                    address: {
                        street: '456 Test St',
                        city: 'Test City',
                        state: 'Test State',
                        pincode: '12345'
                    },
                    creditLimit: 10000,
                    totalDue: 5000,
                    isActive: true
                }
            ]);
        });

        it('should get customers report', async () => {
            const res = await request(app)
                .get('/api/reports/customers')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('totalCustomers');
            expect(res.body).toHaveProperty('totalDues');
            expect(res.body).toHaveProperty('customersWithDues');
            expect(res.body.totalCustomers).toBe(3);
            expect(res.body.totalDues).toBe(7000); // 2000 + 5000
            expect(Array.isArray(res.body.customersWithDues)).toBe(true);
            expect(res.body.customersWithDues).toHaveLength(2);
        });

        it('should get customers report with dues filter', async () => {
            const res = await request(app)
                .get('/api/reports/customers?hasDues=true')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('totalCustomers');
            expect(res.body).toHaveProperty('totalDues');
            expect(res.body.totalCustomers).toBe(2);
            expect(res.body.totalDues).toBe(7000);
        });
    });
}); 