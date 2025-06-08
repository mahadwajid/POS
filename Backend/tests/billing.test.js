import request from 'supertest';
import app from '../Server.js';
import User from '../Models/User.js';
import Customer from '../Models/Customer.js';
import Product from '../Models/Product.js';
import Bill from '../Models/Bill.js';

describe('Billing Management Tests', () => {
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

    describe('POST /api/bills', () => {
        it('should create new bill when authenticated', async () => {
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

            const res = await request(app)
                .post('/api/bills')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(billData);

            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('customer');
            expect(res.body.items).toHaveLength(1);
            testBill = res.body;
        });

        it('should not create bill without authentication', async () => {
            const res = await request(app)
                .post('/api/bills')
                .send({
                    customer: testCustomer._id,
                    items: [{
                        product: testProduct._id,
                        quantity: 2,
                        price: testProduct.price
                    }],
                    paymentMethod: 'Cash'
                });

            expect(res.status).toBe(401);
        });
    });

    describe('GET /api/bills', () => {
        it('should get all bills when authenticated', async () => {
            const res = await request(app)
                .get('/api/bills')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
        });

        it('should not get bills without authentication', async () => {
            const res = await request(app)
                .get('/api/bills');

            expect(res.status).toBe(401);
        });
    });

    describe('GET /api/bills/:id', () => {
        it('should get bill by id when authenticated', async () => {
            if (!testBill) return;
            
            const res = await request(app)
                .get(`/api/bills/${testBill._id}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('_id', testBill._id);
        });

        it('should not get bill without authentication', async () => {
            if (!testBill) return;

            const res = await request(app)
                .get(`/api/bills/${testBill._id}`);

            expect(res.status).toBe(401);
        });
    });

    describe('PUT /api/bills/:id', () => {
        it('should update bill when authenticated', async () => {
            if (!testBill) return;

            const res = await request(app)
                .put(`/api/bills/${testBill._id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    paymentMethod: 'Card',
                    notes: 'Updated Test Bill'
                });

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('paymentMethod', 'Card');
            expect(res.body).toHaveProperty('notes', 'Updated Test Bill');
        });

        it('should not update bill without authentication', async () => {
            if (!testBill) return;

            const res = await request(app)
                .put(`/api/bills/${testBill._id}`)
                .send({
                    paymentMethod: 'Card'
                });

            expect(res.status).toBe(401);
        });
    });

    describe('DELETE /api/bills/:id', () => {
        it('should delete bill when authenticated', async () => {
            if (!testBill) return;

            const res = await request(app)
                .delete(`/api/bills/${testBill._id}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
        });

        it('should not delete bill without authentication', async () => {
            if (!testBill) return;

            const res = await request(app)
                .delete(`/api/bills/${testBill._id}`);

            expect(res.status).toBe(401);
        });
    });
}); 