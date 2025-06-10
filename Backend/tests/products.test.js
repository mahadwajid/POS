import request from 'supertest';
import app from '../Server.js';
import Product from '../Models/Product.js';

describe('Product Management Tests', () => {
    const newProduct = {
        name: 'Test Product',
        description: 'Test Description',
        price: 100,
        costPrice: 50,
        quantity: 10,
        category: 'Lighting',
        unitType: 'piece',
        sku: 'TEST123',
        brand: 'Test Brand',
        model: 'Test Model',
        warranty: 12,
        lowStockAlert: 5,
        isActive: true,
        supplier: 'Test Supplier',
        location: 'Test Location',
        taxRate: 10,
        discount: 0,
        reorderPoint: 5,
        reorderQuantity: 10,
        lastRestockDate: new Date(),
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        barcode: '123456789',
        dimensions: {
            length: 10,
            width: 5,
            height: 2,
            unit: 'cm'
        },
        weight: {
            value: 1,
            unit: 'kg'
        },
        images: ['test-image-1.jpg', 'test-image-2.jpg'],
        tags: ['test', 'sample'],
        specifications: {
            color: 'Black',
            material: 'Plastic'
        },
        notes: 'Test product notes'
    };

    let testProduct;

    beforeEach(async () => {
        // Clear test data before each test
        await Product.deleteOne({ sku: newProduct.sku });
        
        // Create test product
        const res = await request(app)
            .post('/api/products')
            .set('Authorization', `Bearer ${global.adminToken}`)
            .send(newProduct);
        testProduct = res.body;
    });

    afterAll(async () => {
        // Clean up test product
        await Product.deleteOne({ sku: newProduct.sku });
    });

    describe('GET /api/products', () => {
        it('should get all products when authenticated', async () => {
            const res = await request(app)
                .get('/api/products')
                .set('Authorization', `Bearer ${global.adminToken}`);

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
        it('should create new product when authenticated', async () => {
            const anotherProduct = {
                ...newProduct,
                sku: 'TEST456',
                name: 'Another Test Product',
                barcode: '987654321'
            };

            const res = await request(app)
                .post('/api/products')
                .set('Authorization', `Bearer ${global.adminToken}`)
                .send(anotherProduct);

            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('sku', 'TEST456');
            expect(res.body).toHaveProperty('name', 'Another Test Product');
        });

        it('should not create product without authentication', async () => {
            const res = await request(app)
                .post('/api/products')
                .send(newProduct);

            expect(res.status).toBe(401);
        });
    });

    describe('PUT /api/products/:id', () => {
        it('should update product when authenticated', async () => {
            const updateData = {
                name: 'Updated Test Product',
                price: 150,
                costPrice: 75,
                quantity: 20,
                category: 'Lighting',
                unitType: 'piece',
                description: 'Updated description',
                brand: 'Updated Brand',
                model: 'Updated Model',
                warranty: 24,
                lowStockAlert: 10,
                supplier: 'Updated Supplier',
                location: 'Updated Location',
                taxRate: 15,
                discount: 5,
                reorderPoint: 10,
                reorderQuantity: 20,
                lastRestockDate: new Date(),
                expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
                barcode: '987654321',
                dimensions: {
                    length: 20,
                    width: 10,
                    height: 5,
                    unit: 'cm'
                },
                weight: {
                    value: 2,
                    unit: 'kg'
                },
                images: ['updated-image-1.jpg', 'updated-image-2.jpg'],
                tags: ['updated', 'sample'],
                specifications: {
                    color: 'White',
                    material: 'Metal'
                },
                notes: 'Updated product notes'
            };

            const res = await request(app)
                .put(`/api/products/${testProduct._id}`)
                .set('Authorization', `Bearer ${global.adminToken}`)
                .send(updateData);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('name', updateData.name);
            expect(res.body).toHaveProperty('price', updateData.price);
            expect(res.body).toHaveProperty('costPrice', updateData.costPrice);
            expect(res.body).toHaveProperty('quantity', updateData.quantity);
            expect(res.body).toHaveProperty('category', updateData.category);
            expect(res.body).toHaveProperty('description', updateData.description);
            expect(res.body).toHaveProperty('brand', updateData.brand);
            expect(res.body).toHaveProperty('model', updateData.model);
            expect(res.body).toHaveProperty('warranty', updateData.warranty);
            expect(res.body).toHaveProperty('lowStockAlert', updateData.lowStockAlert);
            expect(res.body).toHaveProperty('supplier', updateData.supplier);
            expect(res.body).toHaveProperty('location', updateData.location);
            expect(res.body).toHaveProperty('taxRate', updateData.taxRate);
            expect(res.body).toHaveProperty('discount', updateData.discount);
            expect(res.body).toHaveProperty('reorderPoint', updateData.reorderPoint);
            expect(res.body).toHaveProperty('reorderQuantity', updateData.reorderQuantity);
            expect(res.body).toHaveProperty('barcode', updateData.barcode);
            expect(res.body.dimensions).toEqual(updateData.dimensions);
            expect(res.body.weight).toEqual(updateData.weight);
            expect(res.body.images).toEqual(updateData.images);
            expect(res.body.tags).toEqual(updateData.tags);
            expect(res.body.specifications).toEqual(updateData.specifications);
            expect(res.body).toHaveProperty('notes', updateData.notes);
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
        it('should delete product when authenticated', async () => {
            const res = await request(app)
                .delete(`/api/products/${testProduct._id}`)
                .set('Authorization', `Bearer ${global.adminToken}`);

            expect(res.status).toBe(200);
            
            // Verify product is deleted
            const deletedProduct = await Product.findById(testProduct._id);
            expect(deletedProduct).toBeNull();
        });

        it('should not delete product without authentication', async () => {
            const res = await request(app)
                .delete(`/api/products/${testProduct._id}`);

            expect(res.status).toBe(401);
        });
    });
}); 