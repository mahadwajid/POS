import request from 'supertest';
import app from '../Server.js';
import User from '../Models/User.js';
import Bill from '../Models/Bill.js';
import Product from '../Models/Product.js';
import Customer from '../Models/Customer.js';

describe('Reports Tests', () => {
    let adminToken;
    let testCustomer;
    let testProduct;
    let testBill;

    beforeAll(async () => {
        // Create admin user
        const admin = new User({
            name: 'Admin User',
            email: 'admin@example.com',
            password: 'Admin@123',
            role: 'super_admin'
        });
        await admin.save();

        // Login to get token
        const loginRes = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'admin@example.com',
                password: 'Admin@123'
            });

        adminToken = loginRes.body.token;

        // Create test customer
        const customerRes = await request(app)
            .post('/api/customers')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                name: 'Test Customer',
                email: 'test@customer.com',
                phone: '1234567890',
                address: '123 Test St'
            });
        testCustomer = customerRes.body;

        // Create test product
        const productRes = await request(app)
            .post('/api/products')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                name: 'Test Product',
                description: 'Test Description',
                price: 99.99,
                stock: 100,
                category: 'Test Category'
            });
        testProduct = productRes.body;

        // Create test bill
        const billData = {
            customer: testCustomer._id,
            items: [{
                product: testProduct._id,
                quantity: 2,
                price: testProduct.price,
                total: testProduct.price * 2
            }],
            subtotal: testProduct.price * 2,
            tax: 0,
            total: testProduct.price * 2,
            paidAmount: testProduct.price * 2,
            dueAmount: 0,
            paymentMethod: 'Cash',
            notes: 'Test Bill'
        };

        const billRes = await request(app)
            .post('/api/bills')
            .set('Authorization', `Bearer ${adminToken}`)
            .send(billData);
        testBill = billRes.body;
    });

    afterAll(async () => {
        // Clean up test data
        await User.deleteOne({ email: 'admin@example.com' });
        if (testCustomer) {
            await Customer.deleteOne({ _id: testCustomer._id });
        }
        if (testProduct) {
            await Product.deleteOne({ _id: testProduct._id });
        }
        if (testBill) {
            await Bill.deleteOne({ _id: testBill._id });
        }
    });

    describe('GET /api/reports/sales', () => {
        it('should get sales report when authenticated', async () => {
            const res = await request(app)
                .get('/api/reports/sales')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('dailySales');
            expect(res.body).toHaveProperty('sales');
            expect(res.body).toHaveProperty('totals');
            expect(res.body.totals).toHaveProperty('total');
            expect(res.body.totals).toHaveProperty('paid');
            expect(res.body.totals).toHaveProperty('due');
        });

        it('should not get sales report without authentication', async () => {
            const res = await request(app)
                .get('/api/reports/sales');

            expect(res.status).toBe(401);
        });
    });

    describe('GET /api/reports/inventory', () => {
        it('should get inventory report when authenticated', async () => {
            const res = await request(app)
                .get('/api/reports/inventory')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('totalProducts');
            expect(res.body).toHaveProperty('totalValue');
            expect(res.body).toHaveProperty('lowStockItems');
        });

        it('should not get inventory report without authentication', async () => {
            const res = await request(app)
                .get('/api/reports/inventory');

            expect(res.status).toBe(401);
        });
    });

    describe('GET /api/reports/customers', () => {
        it('should get customer report when authenticated', async () => {
            const res = await request(app)
                .get('/api/reports/customers')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('totalCustomers');
            expect(res.body).toHaveProperty('totalDues');
            expect(res.body).toHaveProperty('customersWithDues');
        });

        it('should not get customer report without authentication', async () => {
            const res = await request(app)
                .get('/api/reports/customers');

            expect(res.status).toBe(401);
        });
    });
}); 