const request = require('supertest');
const app = require('../Server');
const User = require('../Models/User');
const bcrypt = require('bcryptjs');

describe('User Management Tests', () => {
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

    describe('POST /api/users', () => {
        it('should create a new user', async () => {
            const userData = {
                name: 'New User',
                email: 'newuser@example.com',
                password: 'NewUser@123',
                role: 'admin',
                isActive: true
            };

            const res = await request(app)
                .post('/api/users')
                .set('Authorization', `Bearer ${token}`)
                .send(userData);

            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('_id');
            expect(res.body.name).toBe(userData.name);
            expect(res.body.email).toBe(userData.email);
            expect(res.body.role).toBe(userData.role);
            expect(res.body).not.toHaveProperty('password');
        });

        it('should not create user without authentication', async () => {
            const userData = {
                name: 'New User',
                email: 'newuser@example.com',
                password: 'NewUser@123'
            };

            const res = await request(app)
                .post('/api/users')
                .send(userData);

            expect(res.status).toBe(401);
        });

        it('should not create user with duplicate email', async () => {
            const userData = {
                name: 'Duplicate User',
                email: 'test@example.com',
                password: 'Duplicate@123'
            };

            const res = await request(app)
                .post('/api/users')
                .set('Authorization', `Bearer ${token}`)
                .send(userData);

            expect(res.status).toBe(400);
        });

        it('should not create user with invalid role', async () => {
            const userData = {
                name: 'Invalid Role User',
                email: 'invalidrole@example.com',
                password: 'Invalid@123',
                role: 'invalid_role'
            };

            const res = await request(app)
                .post('/api/users')
                .set('Authorization', `Bearer ${token}`)
                .send(userData);

            expect(res.status).toBe(400);
        });
    });

    describe('GET /api/users', () => {
        beforeEach(async () => {
            // Create some test users
            await User.create([
                {
                    name: 'User 1',
                    email: 'user1@example.com',
                    password: await bcrypt.hash('User1@123', 10),
                    role: 'admin',
                    isActive: true
                },
                {
                    name: 'User 2',
                    email: 'user2@example.com',
                    password: await bcrypt.hash('User2@123', 10),
                    role: 'cashier',
                    isActive: true
                }
            ]);
        });

        it('should get all users', async () => {
            const res = await request(app)
                .get('/api/users')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body).toHaveLength(3); // Including the test user
        });

        it('should filter users by role', async () => {
            const res = await request(app)
                .get('/api/users?role=admin')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body).toHaveLength(1);
            expect(res.body[0].role).toBe('admin');
        });

        it('should search users by name', async () => {
            const res = await request(app)
                .get('/api/users?search=User 1')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body).toHaveLength(1);
            expect(res.body[0].name).toBe('User 1');
        });
    });

    describe('PUT /api/users/:id', () => {
        let testUserToUpdate;

        beforeEach(async () => {
            testUserToUpdate = await User.create({
                name: 'User To Update',
                email: 'updateme@example.com',
                password: await bcrypt.hash('Update@123', 10),
                role: 'cashier',
                isActive: true
            });
        });

        it('should update user details', async () => {
            const updateData = {
                name: 'Updated User',
                role: 'admin',
                isActive: false
            };

            const res = await request(app)
                .put(`/api/users/${testUserToUpdate._id}`)
                .set('Authorization', `Bearer ${token}`)
                .send(updateData);

            expect(res.status).toBe(200);
            expect(res.body.name).toBe(updateData.name);
            expect(res.body.role).toBe(updateData.role);
            expect(res.body.isActive).toBe(updateData.isActive);
        });

        it('should not update user without authentication', async () => {
            const updateData = {
                name: 'Updated User'
            };

            const res = await request(app)
                .put(`/api/users/${testUserToUpdate._id}`)
                .send(updateData);

            expect(res.status).toBe(401);
        });

        it('should not update non-existent user', async () => {
            const updateData = {
                name: 'Updated User'
            };

            const res = await request(app)
                .put('/api/users/nonexistentid')
                .set('Authorization', `Bearer ${token}`)
                .send(updateData);

            expect(res.status).toBe(404);
        });

        it('should not update user with duplicate email', async () => {
            const updateData = {
                email: 'test@example.com' // Email of the test user
            };

            const res = await request(app)
                .put(`/api/users/${testUserToUpdate._id}`)
                .set('Authorization', `Bearer ${token}`)
                .send(updateData);

            expect(res.status).toBe(400);
        });
    });

    describe('PATCH /api/users/:id/password', () => {
        let testUserToUpdate;

        beforeEach(async () => {
            testUserToUpdate = await User.create({
                name: 'Password User',
                email: 'password@example.com',
                password: await bcrypt.hash('OldPass@123', 10),
                role: 'cashier',
                isActive: true
            });
        });

        it('should update user password', async () => {
            const updateData = {
                currentPassword: 'OldPass@123',
                newPassword: 'NewPass@123'
            };

            const res = await request(app)
                .patch(`/api/users/${testUserToUpdate._id}/password`)
                .set('Authorization', `Bearer ${token}`)
                .send(updateData);

            expect(res.status).toBe(200);
            expect(res.body.message).toBe('Password updated successfully');

            // Verify new password works
            const loginRes = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'password@example.com',
                    password: 'NewPass@123'
                });

            expect(loginRes.status).toBe(200);
            expect(loginRes.body).toHaveProperty('token');
        });

        it('should not update password without current password', async () => {
            const updateData = {
                newPassword: 'NewPass@123'
            };

            const res = await request(app)
                .patch(`/api/users/${testUserToUpdate._id}/password`)
                .set('Authorization', `Bearer ${token}`)
                .send(updateData);

            expect(res.status).toBe(400);
        });

        it('should not update password with incorrect current password', async () => {
            const updateData = {
                currentPassword: 'WrongPass@123',
                newPassword: 'NewPass@123'
            };

            const res = await request(app)
                .patch(`/api/users/${testUserToUpdate._id}/password`)
                .set('Authorization', `Bearer ${token}`)
                .send(updateData);

            expect(res.status).toBe(400);
        });
    });
}); 