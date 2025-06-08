import request from 'supertest';
import app from '../Server.js';
import User from '../Models/User.js';
import Customer from '../Models/Customer.js';

describe('Customer Management Tests', () => {
    let adminToken;
    let testCustomer;

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
    });

    afterAll(async () => {
        // Clean up test data
        await User.deleteOne({ email: 'admin@example.com' });
        if (testCustomer) {
            await Customer.deleteOne({ _id: testCustomer._id });
        }
    });

    describe('GET /api/customers', () => {
        it('should get all customers when authenticated', async () => {
            const res = await request(app)
                .get('/api/customers')
                .set('Authorization', `Bearer ${adminToken}`);

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
            const res = await request(app)
                .post('/api/customers')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Test Customer',
                    email: 'test@customer.com',
                    phone: '1234567890',
                    address: '123 Test St'
                });

            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('name', 'Test Customer');
            testCustomer = res.body;
        });

        it('should not create customer without authentication', async () => {
            const res = await request(app)
                .post('/api/customers')
                .send({
                    name: 'Test Customer 2',
                    email: 'test2@customer.com',
                    phone: '0987654321',
                    address: '456 Test Ave'
                });

            expect(res.status).toBe(401);
        });
    });

    describe('PUT /api/customers/:id', () => {
        it('should update customer when authenticated', async () => {
            const res = await request(app)
                .put(`/api/customers/${testCustomer._id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Updated Test Customer',
                    phone: '9876543210'
                });

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('name', 'Updated Test Customer');
            expect(res.body).toHaveProperty('phone', '9876543210');
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
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
        });

        it('should not delete customer without authentication', async () => {
            const res = await request(app)
                .delete(`/api/customers/${testCustomer._id}`);

            expect(res.status).toBe(401);
        });
    });
}); 