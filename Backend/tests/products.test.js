const request = require('supertest');
const app = require('../Server');
const User = require('../Models/User');
const Product = require('../Models/Product');
const bcrypt = require('bcryptjs');

describe('Product Management Tests', () => {
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

    describe('POST /api/products', () => {
        it('should create a new product', async () => {
            const productData = {
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
            };

            const res = await request(app)
                .post('/api/products')
                .set('Authorization', `Bearer ${token}`)
                .send(productData);

            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('_id');
            expect(res.body.name).toBe(productData.name);
            expect(res.body.sku).toBe(productData.sku);
            expect(res.body.quantity).toBe(productData.quantity);
        });

        it('should not create product without authentication', async () => {
            const productData = {
                name: 'Test Product',
                price: 1000,
                quantity: 50
            };

            const res = await request(app)
                .post('/api/products')
                .send(productData);

            expect(res.status).toBe(401);
        });

        it('should not create product with duplicate SKU', async () => {
            // First create a product
            await Product.create({
                name: 'Existing Product',
                sku: 'TEST001',
                price: 1000,
                quantity: 50,
                category: 'Electronics',
                unitType: 'piece'
            });

            // Try to create another product with same SKU
            const productData = {
                name: 'Test Product',
                sku: 'TEST001',
                price: 1000,
                quantity: 50,
                category: 'Electronics',
                unitType: 'piece'
            };

            const res = await request(app)
                .post('/api/products')
                .set('Authorization', `Bearer ${token}`)
                .send(productData);

            expect(res.status).toBe(400);
        });
    });

    describe('GET /api/products', () => {
        beforeEach(async () => {
            // Create some test products
            await Product.create([
                {
                    name: 'Product 1',
                    description: 'Description 1',
                    category: 'Electronics',
                    price: 1000,
                    costPrice: 800,
                    quantity: 50,
                    unitType: 'piece',
                    sku: 'TEST001',
                    brand: 'Brand 1',
                    model: 'Model 1',
                    warranty: '1 year',
                    lowStockAlert: 10,
                    isActive: true
                },
                {
                    name: 'Product 2',
                    description: 'Description 2',
                    category: 'Clothing',
                    price: 500,
                    costPrice: 400,
                    quantity: 100,
                    unitType: 'piece',
                    sku: 'TEST002',
                    brand: 'Brand 2',
                    model: 'Model 2',
                    warranty: 'None',
                    lowStockAlert: 20,
                    isActive: true
                }
            ]);
        });

        it('should get all products', async () => {
            const res = await request(app)
                .get('/api/products')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body).toHaveLength(2);
        });

        it('should search products by name', async () => {
            const res = await request(app)
                .get('/api/products?search=Product 1')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body).toHaveLength(1);
            expect(res.body[0].name).toBe('Product 1');
        });

        it('should search products by category', async () => {
            const res = await request(app)
                .get('/api/products?category=Electronics')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body).toHaveLength(1);
            expect(res.body[0].category).toBe('Electronics');
        });

        it('should filter low stock products', async () => {
            // Create a low stock product
            await Product.create({
                name: 'Low Stock Product',
                category: 'Electronics',
                price: 1000,
                quantity: 5,
                unitType: 'piece',
                sku: 'TEST003',
                lowStockAlert: 10,
                isActive: true
            });

            const res = await request(app)
                .get('/api/products?lowStock=true')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body).toHaveLength(1);
            expect(res.body[0].name).toBe('Low Stock Product');
        });
    });

    describe('PUT /api/products/:id', () => {
        let testProduct;

        beforeEach(async () => {
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

        it('should update product details', async () => {
            const updateData = {
                name: 'Updated Product',
                price: 1200,
                quantity: 75
            };

            const res = await request(app)
                .put(`/api/products/${testProduct._id}`)
                .set('Authorization', `Bearer ${token}`)
                .send(updateData);

            expect(res.status).toBe(200);
            expect(res.body.name).toBe(updateData.name);
            expect(res.body.price).toBe(updateData.price);
            expect(res.body.quantity).toBe(updateData.quantity);
        });

        it('should not update product without authentication', async () => {
            const updateData = {
                name: 'Updated Product'
            };

            const res = await request(app)
                .put(`/api/products/${testProduct._id}`)
                .send(updateData);

            expect(res.status).toBe(401);
        });

        it('should not update non-existent product', async () => {
            const updateData = {
                name: 'Updated Product'
            };

            const res = await request(app)
                .put('/api/products/nonexistentid')
                .set('Authorization', `Bearer ${token}`)
                .send(updateData);

            expect(res.status).toBe(404);
        });
    });

    describe('PATCH /api/products/:id/stock', () => {
        let testProduct;

        beforeEach(async () => {
            testProduct = await Product.create({
                name: 'Test Product',
                category: 'Electronics',
                price: 1000,
                quantity: 50,
                unitType: 'piece',
                sku: 'TEST001',
                isActive: true
            });
        });

        it('should update product stock', async () => {
            const updateData = {
                quantity: 75,
                type: 'add' // or 'subtract'
            };

            const res = await request(app)
                .patch(`/api/products/${testProduct._id}/stock`)
                .set('Authorization', `Bearer ${token}`)
                .send(updateData);

            expect(res.status).toBe(200);
            expect(res.body.quantity).toBe(125); // 50 + 75
        });

        it('should not allow negative stock', async () => {
            const updateData = {
                quantity: 100,
                type: 'subtract'
            };

            const res = await request(app)
                .patch(`/api/products/${testProduct._id}/stock`)
                .set('Authorization', `Bearer ${token}`)
                .send(updateData);

            expect(res.status).toBe(400);
        });
    });
}); 