import request from 'supertest';
import app from '../Server.js';
import User from '../Models/User.js';

describe('User Management Tests', () => {
    let userId;
    const newUser = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'Test@123',
        role: 'sub_admin',
        isActive: true
    };

    beforeEach(async () => {
        // Clear test data before each test
        await User.deleteOne({ email: newUser.email });
    });

    afterAll(async () => {
        // Clean up test user
        await User.deleteOne({ email: newUser.email });
    });

    describe('POST /api/users', () => {
        it('should create a new user', async () => {
            const res = await request(app)
                .post('/api/users')
                .set('Authorization', `Bearer ${global.adminToken}`)
                .send(newUser);

            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('_id');
            expect(res.body.email).toBe(newUser.email);
            userId = res.body._id;
        });

        it('should not create user with existing email', async () => {
            // Create user first
            await User.create(newUser);

            const res = await request(app)
                .post('/api/users')
                .set('Authorization', `Bearer ${global.adminToken}`)
                .send(newUser);

            expect(res.status).toBe(400);
        });
    });

    describe('GET /api/users', () => {
        it('should get all users', async () => {
            const res = await request(app)
                .get('/api/users')
                .set('Authorization', `Bearer ${global.adminToken}`);

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
        });
    });

    describe('GET /api/users/:id', () => {
        beforeEach(async () => {
            // Create test user
            const res = await request(app)
                .post('/api/users')
                .set('Authorization', `Bearer ${global.adminToken}`)
                .send(newUser);
            userId = res.body._id;
        });

        it('should get user by id', async () => {
            const res = await request(app)
                .get(`/api/users/${userId}`)
                .set('Authorization', `Bearer ${global.adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('_id', userId);
        });

        it('should return 404 for non-existent user', async () => {
            const res = await request(app)
                .get('/api/users/507f1f77bcf86cd799439011')
                .set('Authorization', `Bearer ${global.adminToken}`);

            expect(res.status).toBe(404);
        });
    });

    describe('PUT /api/users/:id', () => {
        beforeEach(async () => {
            // Create test user
            const res = await request(app)
                .post('/api/users')
                .set('Authorization', `Bearer ${global.adminToken}`)
                .send(newUser);
            userId = res.body._id;
        });

        it('should update user', async () => {
            const updateData = {
                name: 'Updated Test User',
                isActive: false
            };

            const res = await request(app)
                .put(`/api/users/${userId}`)
                .set('Authorization', `Bearer ${global.adminToken}`)
                .send(updateData);

            expect(res.status).toBe(200);
            expect(res.body.name).toBe(updateData.name);
            expect(res.body.isActive).toBe(updateData.isActive);
        });
    });

    describe('DELETE /api/users/:id', () => {
        beforeEach(async () => {
            // Create test user
            const res = await request(app)
                .post('/api/users')
                .set('Authorization', `Bearer ${global.adminToken}`)
                .send(newUser);
            userId = res.body._id;
        });

        it('should delete user', async () => {
            const res = await request(app)
                .delete(`/api/users/${userId}`)
                .set('Authorization', `Bearer ${global.adminToken}`);

            expect(res.status).toBe(200);
        });

        it('should return 404 when deleting non-existent user', async () => {
            const res = await request(app)
                .delete('/api/users/507f1f77bcf86cd799439011')
                .set('Authorization', `Bearer ${global.adminToken}`);

            expect(res.status).toBe(404);
        });
    });
}); 