import request from 'supertest';
import express from 'express';
import authRoutes from '../../routes/auth.routes';
import { User } from '../../models/user.model';
import { createTestUser, generateToken } from '../helpers/testHelpers';
import { Types } from 'mongoose';

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Auth Endpoints', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'SecurePass123',
        name: 'New User',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User registered successfully');
      expect(response.body.data.user).toHaveProperty('email', userData.email);
      expect(response.body.data.user).toHaveProperty('name', userData.name);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user).not.toHaveProperty('password');
    });

    it('should fail with invalid email', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'SecurePass123',
        name: 'Test User',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should fail with weak password', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'weak',
        name: 'Test User',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should fail with duplicate email', async () => {
      const userData = {
        email: 'duplicate@example.com',
        password: 'SecurePass123',
        name: 'First User',
      };

      await request(app).post('/api/auth/register').send(userData);

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User with this email already exists');
    });

    it('should fail with invalid name length', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'SecurePass123',
        name: 'A',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login user successfully', async () => {
      const user = await createTestUser({
        email: 'login@example.com',
        password: 'Test1234',
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'Test1234',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Login successful');
      expect(response.body.data.user).toHaveProperty('email', 'login@example.com');
      expect(response.body.data).toHaveProperty('token');
    });

    it('should fail with wrong password', async () => {
      await createTestUser({
        email: 'test@example.com',
        password: 'CorrectPass123',
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'WrongPass123',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid email or password');
    });

    it('should fail with non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Test1234',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid email or password');
    });

    it('should fail with invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'invalid-email',
          password: 'Test1234',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should get current user successfully', async () => {
      const user = await createTestUser();
      const token = generateToken((user._id as Types.ObjectId).toString());

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toHaveProperty('email', user.email);
      expect(response.body.data.user).toHaveProperty('name', user.name);
      expect(response.body.data.user).not.toHaveProperty('password');
    });

    it('should fail without token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access denied. No token provided.');
    });

    it('should fail with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid or expired token.');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully', async () => {
      const user = await createTestUser();
      const token = generateToken((user._id as Types.ObjectId).toString());

      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Logout successful');
    });

    it('should fail without token', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/guest', () => {
    it('should create guest session successfully', async () => {
      const response = await request(app)
        .post('/api/auth/guest')
        .send({ name: 'Guest User' })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Guest session created successfully');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user.name).toBe('Guest User');
      expect(response.body.data.user.isGuest).toBe(true);
    });

    it('should create unique guest users', async () => {
      const response1 = await request(app)
        .post('/api/auth/guest')
        .send({ name: 'Guest User 1' })
        .expect(201);

      const response2 = await request(app)
        .post('/api/auth/guest')
        .send({ name: 'Guest User 2' })
        .expect(201);

      expect(response1.body.data.user.id).not.toBe(response2.body.data.user.id);
      expect(response1.body.data.token).not.toBe(response2.body.data.token);
    });

    it('should fail with invalid name length', async () => {
      const response = await request(app)
        .post('/api/auth/guest')
        .send({ name: 'A' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should fail without name', async () => {
      const response = await request(app)
        .post('/api/auth/guest')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should fail with name exceeding max length', async () => {
      const longName = 'A'.repeat(51);

      const response = await request(app)
        .post('/api/auth/guest')
        .send({ name: longName })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should generate valid JWT token for guest', async () => {
      const response = await request(app)
        .post('/api/auth/guest')
        .send({ name: 'Guest User' })
        .expect(201);

      const token = response.body.data.token;

      // Use the token to access a protected endpoint
      const meResponse = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(meResponse.body.success).toBe(true);
      expect(meResponse.body.data.user.name).toBe('Guest User');
    });

    it('should trim whitespace from guest name', async () => {
      const response = await request(app)
        .post('/api/auth/guest')
        .send({ name: '  Guest User  ' })
        .expect(201);

      expect(response.body.data.user.name).toBe('Guest User');
    });

    it('should create guest user with unique email', async () => {
      const response1 = await request(app)
        .post('/api/auth/guest')
        .send({ name: 'Guest 1' })
        .expect(201);

      const response2 = await request(app)
        .post('/api/auth/guest')
        .send({ name: 'Guest 2' })
        .expect(201);

      // Verify both guests can access their accounts
      const me1 = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${response1.body.data.token}`)
        .expect(200);

      const me2 = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${response2.body.data.token}`)
        .expect(200);

      expect(me1.body.data.user.id).not.toBe(me2.body.data.user.id);
    });
  });
});
