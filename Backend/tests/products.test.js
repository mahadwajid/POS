import request from 'supertest';
import app from '../Server.js';
import User from '../Models/User.js';
import Product from '../Models/Product.js';

describe('Product Management Tests', () => {
    let adminToken;
    let testProduct;

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
        if (testProduct) {
            await Product.deleteOne({ _id: testProduct._id });
        }
    });

    describe('GET /api/products', () => {
        it('should get all products when authenticated', async () => {
            const res = await request(app)
                .get('/api/products')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
        });

        it('should not get products without authentication', async () => {
            const res = await request(app)
                .get('/api/products');

            expect(res.status).toBe(401);
        });
    });

    describe('POST /api/products', () => {
        it('should create new product when authenticated as admin', async () => {
            const res = await request(app)
                .post('/api/products')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Test Product',
                    description: 'Test Description',
                    price: 99.99,
                    stock: 100,
                    category: 'Test Category'
                });

            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('name', 'Test Product');
            testProduct = res.body;
        });

        it('should not create product without authentication', async () => {
            const res = await request(app)
                .post('/api/products')
                .send({
                    name: 'Test Product 2',
                    description: 'Test Description 2',
                    price: 199.99,
                    stock: 50,
                    category: 'Test Category'
                });

            expect(res.status).toBe(401);
        });
    });

    describe('PUT /api/products/:id', () => {
        it('should update product when authenticated as admin', async () => {
            const res = await request(app)
                .put(`/api/products/${testProduct._id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Updated Test Product',
                    price: 149.99
                });

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('name', 'Updated Test Product');
            expect(res.body).toHaveProperty('price', 149.99);
        });

        it('should not update product without authentication', async () => {
            const res = await request(app)
                .put(`/api/products/${testProduct._id}`)
                .send({
                    name: 'Updated Test Product'
                });

            expect(res.status).toBe(401);
        });
    });

    describe('DELETE /api/products/:id', () => {
        it('should delete product when authenticated as admin', async () => {
            const res = await request(app)
                .delete(`/api/products/${testProduct._id}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
        });

        it('should not delete product without authentication', async () => {
            const res = await request(app)
                .delete(`/api/products/${testProduct._id}`);

            expect(res.status).toBe(401);
        });
    });
}); 