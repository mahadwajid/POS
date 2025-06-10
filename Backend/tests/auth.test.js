import request from 'supertest';
import app from '../Server.js';
import User from '../Models/User.js';

describe('Authentication Tests', () => {
    const testUser = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'Test@123',
        role: 'sub_admin',
        isActive: true
    };

    let token;
    let userId;

    beforeEach(async () => {
        // Clear test data before each test
        await User.deleteOne({ email: testUser.email });
        
        // Create test user
        const user = await User.create(testUser);
        userId = user._id;
        
        // Get token
        const loginRes = await request(app)
            .post('/api/auth/login')
            .send({
                email: testUser.email,
                password: testUser.password
            });
        token = loginRes.body.token;
    });

    afterAll(async () => {
        // Clean up test user
        await User.deleteOne({ email: testUser.email });
    });

    describe('POST /api/auth/login', () => {
        it('should login with valid credentials', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: testUser.email,
                    password: testUser.password
                });

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('token');
            expect(res.body).toHaveProperty('user');
            expect(res.body.user).toHaveProperty('email', testUser.email);
        });

        it('should not login with invalid credentials', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: testUser.email,
                    password: 'wrongpassword'
                });

            expect(res.status).toBe(401);
        });
    });

    describe('GET /api/auth/profile', () => {
        it('should get current user profile', async () => {
            const res = await request(app)
                .get('/api/auth/profile')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('email', testUser.email);
            expect(res.body).toHaveProperty('_id', userId.toString());
        });

        it('should not get profile without token', async () => {
            const res = await request(app)
                .get('/api/auth/profile');

            expect(res.status).toBe(401);
        });
    });
}); 