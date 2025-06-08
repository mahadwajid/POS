const request = require('supertest');
const app = require('../Server');
const User = require('../Models/User');
const Customer = require('../Models/Customer');
const bcrypt = require('bcryptjs');

describe('Customer Management Tests', () => {
    let token;
    let testUser;

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
    });

    describe('POST /api/customers', () => {
        it('should create a new customer', async () => {
            const customerData = {
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
                isActive: true
            };

            const res = await request(app)
                .post('/api/customers')
                .set('Authorization', `Bearer ${token}`)
                .send(customerData);

            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('_id');
            expect(res.body.name).toBe(customerData.name);
            expect(res.body.phone).toBe(customerData.phone);
            expect(res.body.totalDue).toBe(0);
        });

        it('should not create customer without authentication', async () => {
            const customerData = {
                name: 'Test Customer',
                phone: '03001234567'
            };

            const res = await request(app)
                .post('/api/customers')
                .send(customerData);

            expect(res.status).toBe(401);
        });

        it('should not create customer with duplicate phone', async () => {
            // First create a customer
            await Customer.create({
                name: 'Existing Customer',
                phone: '03001234567',
                email: 'existing@test.com',
                address: {
                    street: '123 Test St',
                    city: 'Test City',
                    state: 'Test State',
                    pincode: '12345'
                },
                creditLimit: 10000,
                isActive: true
            });

            // Try to create another customer with same phone
            const customerData = {
                name: 'Test Customer',
                phone: '03001234567',
                email: 'customer@test.com'
            };

            const res = await request(app)
                .post('/api/customers')
                .set('Authorization', `Bearer ${token}`)
                .send(customerData);

            expect(res.status).toBe(400);
        });
    });

    describe('GET /api/customers', () => {
        beforeEach(async () => {
            // Create some test customers
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
                    creditLimit: 10000,
                    totalDue: 0,
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
                    creditLimit: 20000,
                    totalDue: 5000,
                    isActive: true
                }
            ]);
        });

        it('should get all customers', async () => {
            const res = await request(app)
                .get('/api/customers')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body).toHaveLength(2);
        });

        it('should search customers by name', async () => {
            const res = await request(app)
                .get('/api/customers?search=Customer 1')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body).toHaveLength(1);
            expect(res.body[0].name).toBe('Customer 1');
        });

        it('should search customers by phone', async () => {
            const res = await request(app)
                .get('/api/customers?search=03002222222')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body).toHaveLength(1);
            expect(res.body[0].phone).toBe('03002222222');
        });
    });

    describe('PUT /api/customers/:id', () => {
        let testCustomer;

        beforeEach(async () => {
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
        });

        it('should update customer details', async () => {
            const updateData = {
                name: 'Updated Customer',
                creditLimit: 15000
            };

            const res = await request(app)
                .put(`/api/customers/${testCustomer._id}`)
                .set('Authorization', `Bearer ${token}`)
                .send(updateData);

            expect(res.status).toBe(200);
            expect(res.body.name).toBe(updateData.name);
            expect(res.body.creditLimit).toBe(updateData.creditLimit);
        });

        it('should not update customer without authentication', async () => {
            const updateData = {
                name: 'Updated Customer'
            };

            const res = await request(app)
                .put(`/api/customers/${testCustomer._id}`)
                .send(updateData);

            expect(res.status).toBe(401);
        });

        it('should not update non-existent customer', async () => {
            const updateData = {
                name: 'Updated Customer'
            };

            const res = await request(app)
                .put('/api/customers/nonexistentid')
                .set('Authorization', `Bearer ${token}`)
                .send(updateData);

            expect(res.status).toBe(404);
        });
    });
}); 