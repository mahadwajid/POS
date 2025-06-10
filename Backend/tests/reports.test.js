import request from 'supertest';
import app from '../Server.js';
import Bill from '../Models/Bill.js';
import Product from '../Models/Product.js';
import Customer from '../Models/Customer.js';

describe('Reports Tests', () => {
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

    describe('GET /api/reports/sales', () => {
        it('should get sales report when authenticated', async () => {
            const res = await request(app)
                .get('/api/reports/sales')
                .set('Authorization', `Bearer ${global.adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('dailySales');
            expect(res.body).toHaveProperty('sales');
            expect(res.body).toHaveProperty('totals');
            expect(res.body.totals).toHaveProperty('total');
            expect(res.body.totals).toHaveProperty('paid');
            expect(res.body.totals).toHaveProperty('due');
        });

        it('should not get sales report without authentication', async () => {
            const res = await request(app)
                .get('/api/reports/sales');

            expect(res.status).toBe(401);
        });
    });

    describe('GET /api/reports/inventory', () => {
        it('should get inventory report when authenticated', async () => {
            const res = await request(app)
                .get('/api/reports/inventory')
                .set('Authorization', `Bearer ${global.adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('totalProducts');
            expect(res.body).toHaveProperty('totalValue');
            expect(res.body).toHaveProperty('lowStockItems');
            expect(res.body).toHaveProperty('products');
        });

        it('should not get inventory report without authentication', async () => {
            const res = await request(app)
                .get('/api/reports/inventory');

            expect(res.status).toBe(401);
        });
    });

    describe('GET /api/reports/customers', () => {
        it('should get customer report when authenticated', async () => {
            const res = await request(app)
                .get('/api/reports/customers')
                .set('Authorization', `Bearer ${global.adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('totalCustomers');
            expect(res.body).toHaveProperty('totalDues');
            expect(res.body).toHaveProperty('customersWithDues');
            expect(res.body).toHaveProperty('customers');
        });

        it('should not get customer report without authentication', async () => {
            const res = await request(app)
                .get('/api/reports/customers');

            expect(res.status).toBe(401);
        });
    });
}); 