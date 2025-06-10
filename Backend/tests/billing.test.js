import request from 'supertest';
import app from '../Server.js';
import Bill from '../Models/Bill.js';
import Customer from '../Models/Customer.js';
import Product from '../Models/Product.js';

describe('Billing Management Tests', () => {
    let testCustomer;
    let testProduct;
    let testBill;

    const customerData = {
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

    const productData = {
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
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
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

    const billData = {
        customer: null,
        items: [
            {
                product: null,
                quantity: 2,
                price: 100,
                discount: 0,
                tax: 10,
                total: 220
            }
        ],
        subtotal: 200,
        tax: 20,
        discount: 0,
        total: 220,
        paymentMethod: 'cash',
        paymentStatus: 'paid',
        notes: 'Test bill notes',
        status: 'completed',
        type: 'sale',
        reference: 'BILL001',
        date: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        shippingAddress: {
            street: '123 Test St',
            city: 'Test City',
            state: 'Test State',
            pincode: '123456'
        },
        billingAddress: {
            street: '123 Test St',
            city: 'Test City',
            state: 'Test State',
            pincode: '123456'
        },
        shippingMethod: 'standard',
        shippingCost: 0,
        handlingCost: 0,
        insuranceCost: 0,
        currency: 'USD',
        exchangeRate: 1,
        attachments: ['invoice.pdf', 'receipt.pdf'],
        tags: ['test', 'sample'],
        metadata: {
            source: 'pos',
            device: 'desktop',
            operator: 'test-operator'
        }
    };

    beforeEach(async () => {
        // Clear test data
        await Customer.deleteOne({ phone: customerData.phone });
        await Product.deleteOne({ sku: productData.sku });
        await Bill.deleteOne({ reference: billData.reference });

        // Create test customer
        const customerRes = await request(app)
            .post('/api/customers')
            .set('Authorization', `Bearer ${global.adminToken}`)
            .send(customerData);
        testCustomer = customerRes.body;

        // Create test product
        const productRes = await request(app)
            .post('/api/products')
            .set('Authorization', `Bearer ${global.adminToken}`)
            .send(productData);
        testProduct = productRes.body;

        // Update bill data with customer and product IDs
        billData.customer = testCustomer._id;
        billData.items[0].product = testProduct._id;

        // Create test bill
        const billRes = await request(app)
            .post('/api/bills')
            .set('Authorization', `Bearer ${global.adminToken}`)
            .send(billData);
        testBill = billRes.body;
    });

    afterAll(async () => {
        // Clean up test data
        await Customer.deleteOne({ phone: customerData.phone });
        await Product.deleteOne({ sku: productData.sku });
        await Bill.deleteOne({ reference: billData.reference });
    });

    describe('POST /api/bills', () => {
        it('should create new bill when authenticated', async () => {
            const anotherBill = {
                ...billData,
                reference: 'BILL002',
                items: [
                    {
                        product: testProduct._id,
                        quantity: 1,
                        price: 100,
                        discount: 10,
                        tax: 9,
                        total: 99
                    }
                ],
                subtotal: 100,
                tax: 9,
                discount: 10,
                total: 99
            };

            const res = await request(app)
                .post('/api/bills')
                .set('Authorization', `Bearer ${global.adminToken}`)
                .send(anotherBill);

            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('reference', 'BILL002');
            expect(res.body).toHaveProperty('total', 99);
        });

        it('should not create bill without authentication', async () => {
            const res = await request(app)
                .post('/api/bills')
                .send(billData);

            expect(res.status).toBe(401);
        });
    });

    describe('GET /api/bills', () => {
        it('should get all bills when authenticated', async () => {
            const res = await request(app)
                .get('/api/bills')
                .set('Authorization', `Bearer ${global.adminToken}`);

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
            const res = await request(app)
                .get(`/api/bills/${testBill._id}`)
                .set('Authorization', `Bearer ${global.adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('reference', billData.reference);
            expect(res.body).toHaveProperty('total', billData.total);
        });

        it('should not get bill without authentication', async () => {
            const res = await request(app)
                .get(`/api/bills/${testBill._id}`);

            expect(res.status).toBe(401);
        });
    });

    describe('PUT /api/bills/:id', () => {
        it('should update bill when authenticated', async () => {
            const updateData = {
                items: [
                    {
                        product: testProduct._id,
                        quantity: 3,
                        price: 100,
                        discount: 20,
                        tax: 24,
                        total: 304
                    }
                ],
                subtotal: 300,
                tax: 24,
                discount: 20,
                total: 304,
                paymentMethod: 'card',
                paymentStatus: 'pending',
                notes: 'Updated bill notes',
                status: 'processing',
                shippingAddress: {
                    street: '456 Updated St',
                    city: 'Updated City',
                    state: 'Updated State',
                    pincode: '654321'
                },
                billingAddress: {
                    street: '456 Updated St',
                    city: 'Updated City',
                    state: 'Updated State',
                    pincode: '654321'
                },
                shippingMethod: 'express',
                shippingCost: 10,
                handlingCost: 5,
                insuranceCost: 5,
                currency: 'EUR',
                exchangeRate: 0.85,
                attachments: ['updated-invoice.pdf', 'updated-receipt.pdf'],
                tags: ['updated', 'sample'],
                metadata: {
                    source: 'mobile',
                    device: 'tablet',
                    operator: 'updated-operator'
                }
            };

            const res = await request(app)
                .put(`/api/bills/${testBill._id}`)
                .set('Authorization', `Bearer ${global.adminToken}`)
                .send(updateData);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('total', updateData.total);
            expect(res.body).toHaveProperty('paymentMethod', updateData.paymentMethod);
            expect(res.body).toHaveProperty('paymentStatus', updateData.paymentStatus);
            expect(res.body).toHaveProperty('notes', updateData.notes);
            expect(res.body).toHaveProperty('status', updateData.status);
            expect(res.body.shippingAddress).toEqual(updateData.shippingAddress);
            expect(res.body.billingAddress).toEqual(updateData.billingAddress);
            expect(res.body).toHaveProperty('shippingMethod', updateData.shippingMethod);
            expect(res.body).toHaveProperty('shippingCost', updateData.shippingCost);
            expect(res.body).toHaveProperty('handlingCost', updateData.handlingCost);
            expect(res.body).toHaveProperty('insuranceCost', updateData.insuranceCost);
            expect(res.body).toHaveProperty('currency', updateData.currency);
            expect(res.body).toHaveProperty('exchangeRate', updateData.exchangeRate);
            expect(res.body.attachments).toEqual(updateData.attachments);
            expect(res.body.tags).toEqual(updateData.tags);
            expect(res.body.metadata).toEqual(updateData.metadata);
        });

        it('should not update bill without authentication', async () => {
            const res = await request(app)
                .put(`/api/bills/${testBill._id}`)
                .send({
                    notes: 'Updated bill notes'
                });

            expect(res.status).toBe(401);
        });
    });

    describe('DELETE /api/bills/:id', () => {
        it('should delete bill when authenticated', async () => {
            const res = await request(app)
                .delete(`/api/bills/${testBill._id}`)
                .set('Authorization', `Bearer ${global.adminToken}`);

            expect(res.status).toBe(200);
            
            // Verify bill is deleted
            const deletedBill = await Bill.findById(testBill._id);
            expect(deletedBill).toBeNull();
        });

        it('should not delete bill without authentication', async () => {
            const res = await request(app)
                .delete(`/api/bills/${testBill._id}`);

            expect(res.status).toBe(401);
        });
    });
}); 