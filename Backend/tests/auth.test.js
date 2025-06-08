import request from 'supertest';
import app from '../Server.js';
import User from '../Models/User.js';

describe('Authentication Tests', () => {
    let token;

    beforeAll(async () => {
        // Create test user
        const testUser = new User({
            name: 'Test User',
            email: 'test@example.com',
            password: 'Test@123',
            role: 'super_admin'
        });
        await testUser.save();
    });

    afterAll(async () => {
        // Clean up test data
        await User.deleteOne({ email: 'test@example.com' });
    });

    describe('POST /api/auth/login', () => {
        it('should login with valid credentials', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'Test@123'
                });

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('token');
            expect(res.body.user).toHaveProperty('email', 'test@example.com');
            token = res.body.token;
        });

        it('should not login with invalid password', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'wrongpassword'
                });

            expect(res.status).toBe(401);
        });

        it('should not login with non-existent email', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'nonexistent@example.com',
                    password: 'Test@123'
                });

            expect(res.status).toBe(401);
        });
    });

    describe('GET /api/auth/me', () => {
        it('should get user profile with valid token', async () => {
            const res = await request(app)
                .get('/api/auth/profile')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('email', 'test@example.com');
        });

        it('should not get profile without token', async () => {
            const res = await request(app)
                .get('/api/auth/profile');

            expect(res.status).toBe(401);
        });

        it('should not get profile with invalid token', async () => {
            const res = await request(app)
                .get('/api/auth/profile')
                .set('Authorization', 'Bearer invalidtoken');

            expect(res.status).toBe(401);
        });
    });
}); 