import request from 'supertest';
import app from '../Server.js';
import User from '../Models/User.js';

describe('User Management Tests', () => {
    let adminToken;
    let testUser;

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
        if (testUser) {
            await User.deleteOne({ email: 'test@example.com' });
        }
    });

    describe('GET /api/users', () => {
        it('should get all users when authenticated as admin', async () => {
            const res = await request(app)
                .get('/api/users')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
        });

        it('should not get users without authentication', async () => {
            const res = await request(app)
                .get('/api/users');

            expect(res.status).toBe(401);
        });
    });

    describe('POST /api/users', () => {
        it('should create new user when authenticated as admin', async () => {
            const res = await request(app)
                .post('/api/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Test User',
                    email: 'test@example.com',
                    password: 'Test@123',
                    role: 'sub_admin'
                });

            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('email', 'test@example.com');
            testUser = res.body;
        });

        it('should not create user without authentication', async () => {
            const res = await request(app)
                .post('/api/users')
                .send({
                    name: 'Test User 2',
                    email: 'test2@example.com',
                    password: 'Test@123',
                    role: 'sub_admin'
                });

            expect(res.status).toBe(401);
        });
    });

    describe('PUT /api/users/:id', () => {
        it('should update user when authenticated as admin', async () => {
            const res = await request(app)
                .put(`/api/users/${testUser._id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Updated Test User',
                    role: 'sub_admin'
                });

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('name', 'Updated Test User');
        });

        it('should not update user without authentication', async () => {
            const res = await request(app)
                .put(`/api/users/${testUser._id}`)
                .send({
                    name: 'Updated Test User'
                });

            expect(res.status).toBe(401);
        });
    });

    describe('DELETE /api/users/:id', () => {
        it('should delete user when authenticated as admin', async () => {
            const res = await request(app)
                .delete(`/api/users/${testUser._id}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
        });

        it('should not delete user without authentication', async () => {
            const res = await request(app)
                .delete(`/api/users/${testUser._id}`);

            expect(res.status).toBe(401);
        });
    });
}); 