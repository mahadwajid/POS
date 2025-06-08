const request = require('supertest');
const app = require('../Server');
const User = require('../Models/User');
const Customer = require('../Models/Customer');
const Product = require('../Models/Product');
const Bill = require('../Models/Bill');
const bcrypt = require('bcryptjs');

describe('Billing Tests', () => {
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
            role: 'sub_admin',
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
            category: 'Test Category',
            price: 1000,
            costPrice: 500,
            quantity: 100,
            unitType: 'piece',
            sku: 'TEST001',
            brand: 'Test Brand',
            model: 'Test Model',
            warranty: '12 months',
            lowStockAlert: 10,
            isActive: true
        });
    });

    describe('POST /api/bills', () => {
        it('should create a new bill', async () => {
            const billData = {
                customer: testCustomer._id,
                items: [{
                    product: testProduct._id,
                    quantity: 2,
                    price: testProduct.price,
                    total: testProduct.price * 2
                }],
                subtotal: testProduct.price * 2,
                discount: 0,
                tax: 18,
                total: testProduct.price * 2 * 1.18,
                paidAmount: testProduct.price * 2 * 1.18,
                dueAmount: 0,
                paymentMethod: 'Cash',
                status: 'Paid',
                notes: 'Test bill'
            };

            const res = await request(app)
                .post('/api/bills')
                .set('Authorization', `Bearer ${token}`)
                .send(billData);

            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('_id');
            expect(res.body.customer).toBe(testCustomer._id.toString());
            expect(res.body.items).toHaveLength(1);
            expect(res.body.status).toBe('Paid');
        });

        it('should not create bill without authentication', async () => {
            const billData = {
                customer: testCustomer._id,
                items: [{
                    product: testProduct._id,
                    quantity: 2,
                    price: testProduct.price,
                    total: testProduct.price * 2
                }]
            };

            const res = await request(app)
                .post('/api/bills')
                .send(billData);

            expect(res.status).toBe(401);
        });

        it('should not create bill with invalid customer', async () => {
            const billData = {
                customer: 'invalidcustomerid',
                items: [{
                    product: testProduct._id,
                    quantity: 2,
                    price: testProduct.price,
                    total: testProduct.price * 2
                }]
            };

            const res = await request(app)
                .post('/api/bills')
                .set('Authorization', `Bearer ${token}`)
                .send(billData);

            expect(res.status).toBe(400);
        });
    });

    describe('GET /api/bills', () => {
        beforeEach(async () => {
            // Create some test bills
            await Bill.create([
                {
                    customer: testCustomer._id,
                    items: [{
                        product: testProduct._id,
                        quantity: 2,
                        price: testProduct.price,
                        total: testProduct.price * 2
                    }],
                    subtotal: testProduct.price * 2,
                    discount: 0,
                    tax: 18,
                    total: testProduct.price * 2 * 1.18,
                    paidAmount: testProduct.price * 2 * 1.18,
                    dueAmount: 0,
                    paymentMethod: 'Cash',
                    status: 'Paid',
                    notes: 'Test bill 1'
                },
                {
                    customer: testCustomer._id,
                    items: [{
                        product: testProduct._id,
                        quantity: 1,
                        price: testProduct.price,
                        total: testProduct.price
                    }],
                    subtotal: testProduct.price,
                    discount: 0,
                    tax: 18,
                    total: testProduct.price * 1.18,
                    paidAmount: 0,
                    dueAmount: testProduct.price * 1.18,
                    paymentMethod: 'Cash',
                    status: 'Partially Paid',
                    notes: 'Test bill 2'
                }
            ]);
        });

        it('should get all bills', async () => {
            const res = await request(app)
                .get('/api/bills')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body).toHaveLength(2);
        });

        it('should filter bills by status', async () => {
            const res = await request(app)
                .get('/api/bills?status=Paid')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body).toHaveLength(1);
            expect(res.body[0].status).toBe('Paid');
        });

        it('should filter bills by customer', async () => {
            const res = await request(app)
                .get(`/api/bills?customer=${testCustomer._id}`)
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body).toHaveLength(2);
            expect(res.body[0].customer).toBe(testCustomer._id.toString());
        });
    });
}); 