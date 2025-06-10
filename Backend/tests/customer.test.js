import request from 'supertest';
import app from '../Server.js';
import Customer from '../Models/Customer.js';

describe('Customer Management Tests', () => {
    let customerId;
    const newCustomer = {
        name: 'Test Customer',
        email: 'test@customer.com',
        phone: '1234567890',
        address: '123 Test St'
    };

    beforeEach(async () => {
        // Clear test data before each test
        await Customer.deleteOne({ email: newCustomer.email });
        
        // Create test customer
        const res = await request(app)
            .post('/api/customers')
            .set('Authorization', `Bearer ${global.adminToken}`)
            .send(newCustomer);
        customerId = res.body._id;
    });

    afterAll(async () => {
        // Clean up test customer
        await Customer.deleteOne({ email: newCustomer.email });
    });

    describe('POST /api/customers', () => {
        it('should create a new customer', async () => {
            const anotherCustomer = {
                ...newCustomer,
                email: 'another@customer.com'
            };

            const res = await request(app)
                .post('/api/customers')
                .set('Authorization', `Bearer ${global.adminToken}`)
                .send(anotherCustomer);

            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('_id');
            expect(res.body.email).toBe(anotherCustomer.email);
        });

        it('should not create customer with existing email', async () => {
            const res = await request(app)
                .post('/api/customers')
                .set('Authorization', `Bearer ${global.adminToken}`)
                .send(newCustomer);

            expect(res.status).toBe(400);
        });
    });

    describe('GET /api/customers', () => {
        it('should get all customers', async () => {
            const res = await request(app)
                .get('/api/customers')
                .set('Authorization', `Bearer ${global.adminToken}`);

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
        });
    });

    describe('GET /api/customers/:id', () => {
        it('should get customer by id', async () => {
            const res = await request(app)
                .get(`/api/customers/${customerId}`)
                .set('Authorization', `Bearer ${global.adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('_id', customerId);
        });

        it('should return 404 for non-existent customer', async () => {
            const res = await request(app)
                .get('/api/customers/507f1f77bcf86cd799439011')
                .set('Authorization', `Bearer ${global.adminToken}`);

            expect(res.status).toBe(404);
        });
    });

    describe('PUT /api/customers/:id', () => {
        it('should update customer', async () => {
            const updateData = {
                name: 'Updated Test Customer',
                phone: '9876543210'
            };

            const res = await request(app)
                .put(`/api/customers/${customerId}`)
                .set('Authorization', `Bearer ${global.adminToken}`)
                .send(updateData);

            expect(res.status).toBe(200);
            expect(res.body.name).toBe(updateData.name);
            expect(res.body.phone).toBe(updateData.phone);
        });

        it('should return 404 for non-existent customer', async () => {
            const res = await request(app)
                .put('/api/customers/507f1f77bcf86cd799439011')
                .set('Authorization', `Bearer ${global.adminToken}`)
                .send({ name: 'Updated Test Customer' });

            expect(res.status).toBe(404);
        });
    });

    describe('DELETE /api/customers/:id', () => {
        it('should delete customer', async () => {
            const res = await request(app)
                .delete(`/api/customers/${customerId}`)
                .set('Authorization', `Bearer ${global.adminToken}`);

            expect(res.status).toBe(200);
        });

        it('should return 404 when deleting non-existent customer', async () => {
            const res = await request(app)
                .delete('/api/customers/507f1f77bcf86cd799439011')
                .set('Authorization', `Bearer ${global.adminToken}`);

            expect(res.status).toBe(404);
        });
    });
}); 