import request from 'supertest';
import app from '../Server.js';
import User from '../Models/User.js';

describe('User Management Tests', () => {
    const newUser = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'Test@123',
        role: 'sub_admin',
        isActive: true,
        phone: '1234567890',
        address: {
            street: '123 Test St',
            city: 'Test City',
            state: 'Test State',
            pincode: '123456'
        },
        permissions: ['read', 'write'],
        lastLogin: new Date(),
        department: 'IT',
        position: 'Developer',
        employeeId: 'EMP001',
        joiningDate: new Date(),
        salary: 50000,
        emergencyContact: {
            name: 'Emergency Contact',
            phone: '9876543210',
            relationship: 'Family'
        },
        documents: ['id-proof.pdf', 'resume.pdf'],
        notes: 'Test user notes'
    };

    let testUser;

    beforeEach(async () => {
        // Clear test data before each test
        await User.deleteOne({ email: newUser.email });
        
        // Create test user
        const res = await request(app)
            .post('/api/users')
            .set('Authorization', `Bearer ${global.adminToken}`)
            .send(newUser);
        testUser = res.body;
    });

    afterAll(async () => {
        // Clean up test user
        await User.deleteOne({ email: newUser.email });
    });

    describe('GET /api/users', () => {
        it('should get all users when authenticated', async () => {
            const res = await request(app)
                .get('/api/users')
                .set('Authorization', `Bearer ${global.adminToken}`);

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
        it('should create new user when authenticated', async () => {
            const anotherUser = {
                ...newUser,
                email: 'test3@example.com',
                phone: '9876543210',
                employeeId: 'EMP002'
            };

            const res = await request(app)
                .post('/api/users')
                .set('Authorization', `Bearer ${global.adminToken}`)
                .send(anotherUser);

            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('email', 'test3@example.com');
            expect(res.body).toHaveProperty('phone', '9876543210');
            expect(res.body).toHaveProperty('employeeId', 'EMP002');
        });

        it('should not create user without authentication', async () => {
            const res = await request(app)
                .post('/api/users')
                .send(newUser);

            expect(res.status).toBe(401);
        });
    });

    describe('PUT /api/users/:id', () => {
        it('should update user when authenticated', async () => {
            const updateData = {
                name: 'Updated Test User',
                phone: '9876543210',
                address: {
                    street: '456 Updated St',
                    city: 'Updated City',
                    state: 'Updated State',
                    pincode: '654321'
                },
                department: 'HR',
                position: 'Manager',
                salary: 60000,
                emergencyContact: {
                    name: 'Updated Emergency Contact',
                    phone: '1234567890',
                    relationship: 'Friend'
                },
                documents: ['updated-id-proof.pdf', 'updated-resume.pdf'],
                notes: 'Updated user notes'
            };

            const res = await request(app)
                .put(`/api/users/${testUser._id}`)
                .set('Authorization', `Bearer ${global.adminToken}`)
                .send(updateData);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('name', updateData.name);
            expect(res.body).toHaveProperty('phone', updateData.phone);
            expect(res.body.address).toEqual(updateData.address);
            expect(res.body).toHaveProperty('department', updateData.department);
            expect(res.body).toHaveProperty('position', updateData.position);
            expect(res.body).toHaveProperty('salary', updateData.salary);
            expect(res.body.emergencyContact).toEqual(updateData.emergencyContact);
            expect(res.body.documents).toEqual(updateData.documents);
            expect(res.body).toHaveProperty('notes', updateData.notes);
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
        it('should delete user when authenticated', async () => {
            const res = await request(app)
                .delete(`/api/users/${testUser._id}`)
                .set('Authorization', `Bearer ${global.adminToken}`);

            expect(res.status).toBe(200);
            
            // Verify user is deleted
            const deletedUser = await User.findById(testUser._id);
            expect(deletedUser).toBeNull();
        });

        it('should not delete user without authentication', async () => {
            const res = await request(app)
                .delete(`/api/users/${testUser._id}`);

            expect(res.status).toBe(401);
        });
    });
}); 