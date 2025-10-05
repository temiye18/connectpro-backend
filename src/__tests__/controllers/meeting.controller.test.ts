import request from 'supertest';
import express from 'express';
import meetingRoutes from '../../routes/meeting.routes';
import { Meeting } from '../../models/meeting.model';
import { createTestUser, generateToken, createTestMeeting } from '../helpers/testHelpers';
import { Types } from 'mongoose';

const app = express();
app.use(express.json());
app.use('/api/meetings', meetingRoutes);

describe('Meeting Endpoints', () => {
  describe('POST /api/meetings', () => {
    it('should create a new meeting successfully', async () => {
      const user = await createTestUser();
      const token = generateToken((user._id as Types.ObjectId).toString());

      const meetingData = {
        title: 'Team Standup',
        settings: {
          camera: true,
          microphone: true,
        },
      };

      const response = await request(app)
        .post('/api/meetings')
        .set('Authorization', `Bearer ${token}`)
        .send(meetingData)
        .expect(201);

      expect(response.body).toHaveProperty('meetingId');
      expect(response.body).toHaveProperty('meetingLink');
      expect(response.body).toHaveProperty('meetingCode');
      expect(response.body).toHaveProperty('createdAt');
      expect(response.body.meetingCode).toHaveLength(8);
    });

    it('should create meeting with default title', async () => {
      const user = await createTestUser();
      const token = generateToken((user._id as Types.ObjectId).toString());

      const response = await request(app)
        .post('/api/meetings')
        .set('Authorization', `Bearer ${token}`)
        .send({})
        .expect(201);

      expect(response.body).toHaveProperty('meetingId');
      expect(response.body).toHaveProperty('meetingCode');

      const meeting = await Meeting.findById(response.body.meetingId);
      expect(meeting?.title).toBe('Instant Meeting');
    });

    it('should create meeting with default settings', async () => {
      const user = await createTestUser();
      const token = generateToken((user._id as Types.ObjectId).toString());

      const response = await request(app)
        .post('/api/meetings')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Quick Meeting' })
        .expect(201);

      const meeting = await Meeting.findById(response.body.meetingId);
      expect(meeting?.settings.camera).toBe(true);
      expect(meeting?.settings.microphone).toBe(true);
    });

    it('should create meeting with custom settings', async () => {
      const user = await createTestUser();
      const token = generateToken((user._id as Types.ObjectId).toString());

      const response = await request(app)
        .post('/api/meetings')
        .set('Authorization', `Bearer ${token}`)
        .send({
          settings: {
            camera: false,
            microphone: true,
          },
        })
        .expect(201);

      const meeting = await Meeting.findById(response.body.meetingId);
      expect(meeting?.settings.camera).toBe(false);
      expect(meeting?.settings.microphone).toBe(true);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .post('/api/meetings')
        .send({ title: 'Test Meeting' })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access denied. No token provided.');
    });

    it('should fail with invalid token', async () => {
      const response = await request(app)
        .post('/api/meetings')
        .set('Authorization', 'Bearer invalid-token')
        .send({ title: 'Test Meeting' })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid or expired token.');
    });

    it('should fail with invalid title length', async () => {
      const user = await createTestUser();
      const token = generateToken((user._id as Types.ObjectId).toString());

      const longTitle = 'A'.repeat(101);

      const response = await request(app)
        .post('/api/meetings')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: longTitle })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should fail with invalid settings type', async () => {
      const user = await createTestUser();
      const token = generateToken((user._id as Types.ObjectId).toString());

      const response = await request(app)
        .post('/api/meetings')
        .set('Authorization', `Bearer ${token}`)
        .send({ settings: 'invalid' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should generate unique meeting codes', async () => {
      const user = await createTestUser();
      const token = generateToken((user._id as Types.ObjectId).toString());

      const response1 = await request(app)
        .post('/api/meetings')
        .set('Authorization', `Bearer ${token}`)
        .send({})
        .expect(201);

      const response2 = await request(app)
        .post('/api/meetings')
        .set('Authorization', `Bearer ${token}`)
        .send({})
        .expect(201);

      expect(response1.body.meetingCode).not.toBe(response2.body.meetingCode);
    });

    it('should set correct host for meeting', async () => {
      const user = await createTestUser();
      const token = generateToken((user._id as Types.ObjectId).toString());

      const response = await request(app)
        .post('/api/meetings')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'My Meeting' })
        .expect(201);

      const meeting = await Meeting.findById(response.body.meetingId).populate('host');
      expect(meeting?.host._id.toString()).toBe((user._id as Types.ObjectId).toString());
    });

    it('should set meeting status as scheduled', async () => {
      const user = await createTestUser();
      const token = generateToken((user._id as Types.ObjectId).toString());

      const response = await request(app)
        .post('/api/meetings')
        .set('Authorization', `Bearer ${token}`)
        .send({})
        .expect(201);

      const meeting = await Meeting.findById(response.body.meetingId);
      expect(meeting?.status).toBe('scheduled');
    });
  });
});
