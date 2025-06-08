const request = require('supertest');
const app = require('../Server');
const User = require('../Models/User');
const Expense = require('../Models/Expense');
const bcrypt = require('bcryptjs');

describe('Expense Management Tests', () => {
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

    describe('POST /api/expenses', () => {
        it('should create a new expense', async () => {
            const expenseData = {
                description: 'Test Expense',
                amount: 1000,
                category: 'Utilities',
                date: new Date(),
                paymentMethod: 'Cash',
                reference: 'REF001',
                notes: 'Test Notes'
            };

            const res = await request(app)
                .post('/api/expenses')
                .set('Authorization', `Bearer ${token}`)
                .send(expenseData);

            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('_id');
            expect(res.body.description).toBe(expenseData.description);
            expect(res.body.amount).toBe(expenseData.amount);
            expect(res.body.category).toBe(expenseData.category);
        });

        it('should not create expense without authentication', async () => {
            const expenseData = {
                description: 'Test Expense',
                amount: 1000,
                category: 'Utilities'
            };

            const res = await request(app)
                .post('/api/expenses')
                .send(expenseData);

            expect(res.status).toBe(401);
        });

        it('should not create expense with invalid amount', async () => {
            const expenseData = {
                description: 'Test Expense',
                amount: -1000,
                category: 'Utilities'
            };

            const res = await request(app)
                .post('/api/expenses')
                .set('Authorization', `Bearer ${token}`)
                .send(expenseData);

            expect(res.status).toBe(400);
        });
    });

    describe('GET /api/expenses', () => {
        beforeEach(async () => {
            // Create some test expenses
            await Expense.create([
                {
                    description: 'Expense 1',
                    amount: 1000,
                    category: 'Utilities',
                    date: new Date(),
                    paymentMethod: 'Cash',
                    reference: 'REF001',
                    notes: 'Notes 1',
                    createdBy: testUser._id
                },
                {
                    description: 'Expense 2',
                    amount: 2000,
                    category: 'Rent',
                    date: new Date(),
                    paymentMethod: 'Bank Transfer',
                    reference: 'REF002',
                    notes: 'Notes 2',
                    createdBy: testUser._id
                }
            ]);
        });

        it('should get all expenses', async () => {
            const res = await request(app)
                .get('/api/expenses')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body).toHaveLength(2);
        });

        it('should filter expenses by category', async () => {
            const res = await request(app)
                .get('/api/expenses?category=Utilities')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body).toHaveLength(1);
            expect(res.body[0].category).toBe('Utilities');
        });

        it('should filter expenses by date range', async () => {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - 1);
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + 1);

            const res = await request(app)
                .get(`/api/expenses?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`)
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body).toHaveLength(2);
        });
    });

    describe('PUT /api/expenses/:id', () => {
        let testExpense;

        beforeEach(async () => {
            testExpense = await Expense.create({
                description: 'Test Expense',
                amount: 1000,
                category: 'Utilities',
                date: new Date(),
                paymentMethod: 'Cash',
                reference: 'REF001',
                notes: 'Test Notes',
                createdBy: testUser._id
            });
        });

        it('should update expense details', async () => {
            const updateData = {
                description: 'Updated Expense',
                amount: 1500,
                category: 'Rent'
            };

            const res = await request(app)
                .put(`/api/expenses/${testExpense._id}`)
                .set('Authorization', `Bearer ${token}`)
                .send(updateData);

            expect(res.status).toBe(200);
            expect(res.body.description).toBe(updateData.description);
            expect(res.body.amount).toBe(updateData.amount);
            expect(res.body.category).toBe(updateData.category);
        });

        it('should not update expense without authentication', async () => {
            const updateData = {
                description: 'Updated Expense'
            };

            const res = await request(app)
                .put(`/api/expenses/${testExpense._id}`)
                .send(updateData);

            expect(res.status).toBe(401);
        });

        it('should not update non-existent expense', async () => {
            const updateData = {
                description: 'Updated Expense'
            };

            const res = await request(app)
                .put('/api/expenses/nonexistentid')
                .set('Authorization', `Bearer ${token}`)
                .send(updateData);

            expect(res.status).toBe(404);
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
                    createdBy: testUser._id
                },
                {
                    description: 'Today Expense 2',
                    amount: 2000,
                    category: 'Rent',
                    date: today,
                    paymentMethod: 'Bank Transfer',
                    reference: 'REF002',
                    createdBy: testUser._id
                },
                {
                    description: 'Last Month Expense',
                    amount: 3000,
                    category: 'Utilities',
                    date: lastMonth,
                    paymentMethod: 'Cash',
                    reference: 'REF003',
                    createdBy: testUser._id
                }
            ]);
        });

        it('should get today\'s expense summary', async () => {
            const res = await request(app)
                .get('/api/expenses/summary?period=today')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('total');
            expect(res.body.total).toBe(3000); // 1000 + 2000
        });

        it('should get monthly expense summary', async () => {
            const res = await request(app)
                .get('/api/expenses/summary?period=month')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('total');
            expect(res.body.total).toBe(3000); // Only today's expenses
        });

        it('should get category-wise summary', async () => {
            const res = await request(app)
                .get('/api/expenses/summary?groupBy=category')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('Utilities');
            expect(res.body).toHaveProperty('Rent');
            expect(res.body.Utilities).toBe(1000);
            expect(res.body.Rent).toBe(2000);
        });
    });
}); 