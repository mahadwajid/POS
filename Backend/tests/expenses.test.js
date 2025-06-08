import request from 'supertest';
import app from '../Server.js';
import User from '../Models/User.js';
import Expense from '../Models/Expense.js';
const bcrypt = require('bcryptjs');

describe('Expense Management Tests', () => {
    let adminToken;
    let testExpense;

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
        if (testExpense) {
            await Expense.deleteOne({ _id: testExpense._id });
        }
    });

    describe('GET /api/expenses', () => {
        it('should get all expenses when authenticated', async () => {
            const res = await request(app)
                .get('/api/expenses')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
        });

        it('should not get expenses without authentication', async () => {
            const res = await request(app)
                .get('/api/expenses');

            expect(res.status).toBe(401);
        });
    });

    describe('POST /api/expenses', () => {
        it('should create new expense when authenticated', async () => {
            const res = await request(app)
                .post('/api/expenses')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    title: 'Test Expense',
                    amount: 100,
                    category: 'Test Category',
                    date: new Date(),
                    description: 'Test Description'
                });

            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('title', 'Test Expense');
            testExpense = res.body;
        });

        it('should not create expense without authentication', async () => {
            const res = await request(app)
                .post('/api/expenses')
                .send({
                    title: 'Test Expense',
                    amount: 100,
                    category: 'Test Category'
                });

            expect(res.status).toBe(401);
        });
    });

    describe('GET /api/expenses/:id', () => {
        it('should get expense by id when authenticated', async () => {
            if (!testExpense) return;

            const res = await request(app)
                .get(`/api/expenses/${testExpense._id}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('_id', testExpense._id);
        });

        it('should not get expense without authentication', async () => {
            if (!testExpense) return;

            const res = await request(app)
                .get(`/api/expenses/${testExpense._id}`);

            expect(res.status).toBe(401);
        });
    });

    describe('PUT /api/expenses/:id', () => {
        it('should update expense when authenticated', async () => {
            if (!testExpense) return;

            const res = await request(app)
                .put(`/api/expenses/${testExpense._id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    title: 'Updated Test Expense',
                    amount: 200
                });

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('title', 'Updated Test Expense');
            expect(res.body).toHaveProperty('amount', 200);
        });

        it('should not update expense without authentication', async () => {
            if (!testExpense) return;

            const res = await request(app)
                .put(`/api/expenses/${testExpense._id}`)
                .send({
                    title: 'Updated Test Expense'
                });

            expect(res.status).toBe(401);
        });
    });

    describe('DELETE /api/expenses/:id', () => {
        it('should delete expense when authenticated', async () => {
            if (!testExpense) return;

            const res = await request(app)
                .delete(`/api/expenses/${testExpense._id}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
        });

        it('should not delete expense without authentication', async () => {
            if (!testExpense) return;

            const res = await request(app)
                .delete(`/api/expenses/${testExpense._id}`);

            expect(res.status).toBe(401);
        });
    });

    describe('GET /api/expenses/summary', () => {
        beforeEach(async () => {
            // Create test expenses with different categories and dates
            const today = new Date();
            const lastMonth = new Date();
            lastMonth.setMonth(lastMonth.getMonth() - 1);

            await Expense.create([
                {
                    description: 'Today Expense 1',
                    amount: 1000,
                    category: 'Utilities',
                    date: today,
                    paymentMethod: 'Cash',
                    reference: 'REF001',
                    createdBy: testExpense._id
                },
                {
                    description: 'Today Expense 2',
                    amount: 2000,
                    category: 'Rent',
                    date: today,
                    paymentMethod: 'Bank Transfer',
                    reference: 'REF002',
                    createdBy: testExpense._id
                },
                {
                    description: 'Last Month Expense',
                    amount: 3000,
                    category: 'Utilities',
                    date: lastMonth,
                    paymentMethod: 'Cash',
                    reference: 'REF003',
                    createdBy: testExpense._id
                }
            ]);
        });

        it('should get today\'s expense summary', async () => {
            const res = await request(app)
                .get('/api/expenses/summary?period=today')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('total');
            expect(res.body.total).toBe(3000); // 1000 + 2000
        });

        it('should get monthly expense summary', async () => {
            const res = await request(app)
                .get('/api/expenses/summary?period=month')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('total');
            expect(res.body.total).toBe(3000); // Only today's expenses
        });

        it('should get category-wise summary', async () => {
            const res = await request(app)
                .get('/api/expenses/summary?groupBy=category')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('Utilities');
            expect(res.body).toHaveProperty('Rent');
            expect(res.body.Utilities).toBe(1000);
            expect(res.body.Rent).toBe(2000);
        });
    });
}); 