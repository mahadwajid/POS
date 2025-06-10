import request from 'supertest';
import app from '../Server.js';
import Customer from '../Models/Customer.js';

describe('Customer Management Tests', () => {
    const newCustomer = {
        name: 'Test Customer',
        phone: '1234567890',
        email: 'test@customer.com',
        address: {
            street: '123 Test St',
            city: 'Test City',
            state: 'Test State',
            pincode: '123456'
        },
        creditLimit: 1000,
        totalDue: 0,
        totalPurchases: 0,
        totalPayments: 0,
        notes: 'Test customer notes',
        isActive: true
    };

    let testCustomer;

    beforeEach(async () => {
        // Clear test data before each test
        await Customer.deleteOne({ phone: newCustomer.phone });
        
        // Create test customer
        const res = await request(app)
            .post('/api/customers')
            .set('Authorization', `Bearer ${global.adminToken}`)
            .send(newCustomer);
        testCustomer = res.body;
    });

    afterAll(async () => {
        // Clean up test customer
        await Customer.deleteOne({ phone: newCustomer.phone });
    });

    describe('GET /api/customers', () => {
        it('should get all customers when authenticated', async () => {
            const res = await request(app)
                .get('/api/customers')
                .set('Authorization', `Bearer ${global.adminToken}`);

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
        });

        it('should not get customers without authentication', async () => {
            const res = await request(app)
                .get('/api/customers');

            expect(res.status).toBe(401);
        });
    });

    describe('POST /api/customers', () => {
        it('should create new customer when authenticated', async () => {
            const anotherCustomer = {
                ...newCustomer,
                phone: '9876543210',
                email: 'another@customer.com'
            };

            const res = await request(app)
                .post('/api/customers')
                .set('Authorization', `Bearer ${global.adminToken}`)
                .send(anotherCustomer);

            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('phone', '9876543210');
        });

        it('should not create customer without authentication', async () => {
            const res = await request(app)
                .post('/api/customers')
                .send(newCustomer);

            expect(res.status).toBe(401);
        });
    });

    describe('PUT /api/customers/:id', () => {
        it('should update customer when authenticated', async () => {
            const updateData = {
                name: 'Updated Test Customer',
                phone: '9876543210',
                address: {
                    street: '456 Updated St',
                    city: 'Updated City',
                    state: 'Updated State',
                    pincode: '654321'
                }
            };

            const res = await request(app)
                .put(`/api/customers/${testCustomer._id}`)
                .set('Authorization', `Bearer ${global.adminToken}`)
                .send(updateData);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('name', updateData.name);
            expect(res.body).toHaveProperty('phone', updateData.phone);
            expect(res.body.address).toHaveProperty('street', updateData.address.street);
        });

        it('should not update customer without authentication', async () => {
            const res = await request(app)
                .put(`/api/customers/${testCustomer._id}`)
                .send({
                    name: 'Updated Test Customer'
                });

            expect(res.status).toBe(401);
        });
    });

    describe('DELETE /api/customers/:id', () => {
        it('should delete customer when authenticated', async () => {
            const res = await request(app)
                .delete(`/api/customers/${testCustomer._id}`)
                .set('Authorization', `Bearer ${global.adminToken}`);

            expect(res.status).toBe(200);
        });

        it('should not delete customer without authentication', async () => {
            const res = await request(app)
                .delete(`/api/customers/${testCustomer._id}`);

            expect(res.status).toBe(401);
        });
    });
}); 