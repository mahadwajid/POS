import request from 'supertest';
import app from '../Server.js';
import Expense from '../Models/Expense.js';

describe('Expense Management Tests', () => {
    let testExpense;
    const expenseData = {
        description: 'Test Expense',
        amount: 100,
        category: 'Utilities',
        paymentMethod: 'Cash',
        date: new Date(),
        notes: 'Test notes'
    };

    beforeEach(async () => {
        // Clear test data before each test
        await Expense.deleteMany({});
        
        // Create test expense
        const res = await request(app)
            .post('/api/expenses')
            .set('Authorization', `Bearer ${global.adminToken}`)
            .send(expenseData);
        testExpense = res.body;
    });

    describe('GET /api/expenses', () => {
        it('should get all expenses when authenticated', async () => {
            const res = await request(app)
                .get('/api/expenses')
                .set('Authorization', `Bearer ${global.adminToken}`);

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
            const newExpense = {
                ...expenseData,
                description: 'Another Test Expense'
            };

            const res = await request(app)
                .post('/api/expenses')
                .set('Authorization', `Bearer ${global.adminToken}`)
                .send(newExpense);

            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('description', 'Another Test Expense');
            expect(res.body).toHaveProperty('amount', 100);
        });

        it('should not create expense without authentication', async () => {
            const res = await request(app)
                .post('/api/expenses')
                .send(expenseData);

            expect(res.status).toBe(401);
        });
    });

    describe('GET /api/expenses/:id', () => {
        it('should get expense by id when authenticated', async () => {
            const res = await request(app)
                .get(`/api/expenses/${testExpense._id}`)
                .set('Authorization', `Bearer ${global.adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('_id', testExpense._id);
        });

        it('should not get expense without authentication', async () => {
            const res = await request(app)
                .get(`/api/expenses/${testExpense._id}`);

            expect(res.status).toBe(401);
        });
    });

    describe('PUT /api/expenses/:id', () => {
        it('should update expense when authenticated', async () => {
            const res = await request(app)
                .put(`/api/expenses/${testExpense._id}`)
                .set('Authorization', `Bearer ${global.adminToken}`)
                .send({
                    description: 'Updated Test Expense',
                    amount: 150,
                    category: 'Utilities',
                    paymentMethod: 'Cash'
                });

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('description', 'Updated Test Expense');
            expect(res.body).toHaveProperty('amount', 150);
        });

        it('should not update expense without authentication', async () => {
            const res = await request(app)
                .put(`/api/expenses/${testExpense._id}`)
                .send({
                    description: 'Updated Test Expense'
                });

            expect(res.status).toBe(401);
        });
    });

    describe('DELETE /api/expenses/:id', () => {
        it('should delete expense when authenticated', async () => {
            const res = await request(app)
                .delete(`/api/expenses/${testExpense._id}`)
                .set('Authorization', `Bearer ${global.adminToken}`);

            expect(res.status).toBe(200);
        });

        it('should not delete expense without authentication', async () => {
            const res = await request(app)
                .delete(`/api/expenses/${testExpense._id}`);

            expect(res.status).toBe(401);
        });
    });

    describe('GET /api/expenses/summary', () => {
        beforeEach(async () => {
            // Create test expenses
            await Expense.create([
                {
                    description: 'Test Expense 1',
                    amount: 100,
                    category: 'Utilities',
                    paymentMethod: 'Cash',
                    date: new Date(),
                    notes: 'Test notes 1',
                    createdBy: global.testUser._id
                },
                {
                    description: 'Test Expense 2',
                    amount: 200,
                    category: 'Rent',
                    paymentMethod: 'Cash',
                    date: new Date(),
                    notes: 'Test notes 2',
                    createdBy: global.testUser._id
                }
            ]);
        });

        it('should get expense summary', async () => {
            const res = await request(app)
                .get('/api/expenses/summary')
                .set('Authorization', `Bearer ${global.adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('total');
            expect(res.body).toHaveProperty('count');
        });

        it('should get expense summary by category', async () => {
            const res = await request(app)
                .get('/api/expenses/summary?groupBy=category')
                .set('Authorization', `Bearer ${global.adminToken}`);

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            if (res.body.length > 0) {
                expect(res.body[0]).toHaveProperty('category');
                expect(res.body[0]).toHaveProperty('total');
                expect(res.body[0]).toHaveProperty('count');
            }
        });
    });
}); 