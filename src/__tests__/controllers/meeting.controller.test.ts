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

  describe('GET /api/meetings/recent', () => {
    it('should get recent meetings for authenticated user', async () => {
      const user = await createTestUser();
      const token = generateToken((user._id as Types.ObjectId).toString());

      // Create some meetings
      await createTestMeeting(user._id as Types.ObjectId, { title: 'Meeting 1' });
      await createTestMeeting(user._id as Types.ObjectId, { title: 'Meeting 2' });
      await createTestMeeting(user._id as Types.ObjectId, { title: 'Meeting 3' });

      const response = await request(app)
        .get('/api/meetings/recent')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('meetings');
      expect(response.body.data).toHaveProperty('total');
      expect(response.body.data.meetings).toHaveLength(3);
      expect(response.body.data.total).toBe(3);
      expect(response.body.data.meetings[0]).toHaveProperty('_id');
      expect(response.body.data.meetings[0]).toHaveProperty('title');
      expect(response.body.data.meetings[0]).toHaveProperty('createdAt');
      expect(response.body.data.meetings[0]).toHaveProperty('meetingCode');
      expect(response.body.data.meetings[0]).toHaveProperty('status');
      expect(response.body.data.meetings[0]).toHaveProperty('participants');
    });

    it('should return meetings in descending order by date', async () => {
      const user = await createTestUser();
      const token = generateToken((user._id as Types.ObjectId).toString());

      // Create meetings with delay to ensure different timestamps
      const meeting1 = await createTestMeeting(user._id as Types.ObjectId, { title: 'First Meeting' });
      await new Promise(resolve => setTimeout(resolve, 10));
      const meeting2 = await createTestMeeting(user._id as Types.ObjectId, { title: 'Second Meeting' });
      await new Promise(resolve => setTimeout(resolve, 10));
      const meeting3 = await createTestMeeting(user._id as Types.ObjectId, { title: 'Third Meeting' });

      const response = await request(app)
        .get('/api/meetings/recent')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.data.meetings[0].title).toBe('Third Meeting');
      expect(response.body.data.meetings[1].title).toBe('Second Meeting');
      expect(response.body.data.meetings[2].title).toBe('First Meeting');
    });

    it('should respect limit query parameter', async () => {
      const user = await createTestUser();
      const token = generateToken((user._id as Types.ObjectId).toString());

      // Create 5 meetings
      for (let i = 0; i < 5; i++) {
        await createTestMeeting(user._id as Types.ObjectId, { title: `Meeting ${i + 1}` });
      }

      const response = await request(app)
        .get('/api/meetings/recent?limit=3')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.data.meetings).toHaveLength(3);
      expect(response.body.data.total).toBe(3);
    });

    it('should default to 10 meetings when limit not specified', async () => {
      const user = await createTestUser();
      const token = generateToken((user._id as Types.ObjectId).toString());

      // Create 15 meetings
      for (let i = 0; i < 15; i++) {
        await createTestMeeting(user._id as Types.ObjectId, { title: `Meeting ${i + 1}` });
      }

      const response = await request(app)
        .get('/api/meetings/recent')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.data.meetings).toHaveLength(10);
      expect(response.body.data.total).toBe(10);
    });

    it('should only return meetings for authenticated user', async () => {
      const user1 = await createTestUser({ email: 'user1@example.com' });
      const user2 = await createTestUser({ email: 'user2@example.com' });
      const token1 = generateToken((user1._id as Types.ObjectId).toString());

      // Create meetings for both users
      await createTestMeeting(user1._id as Types.ObjectId, { title: 'User 1 Meeting' });
      await createTestMeeting(user2._id as Types.ObjectId, { title: 'User 2 Meeting' });

      const response = await request(app)
        .get('/api/meetings/recent')
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      expect(response.body.data.meetings).toHaveLength(1);
      expect(response.body.data.meetings[0].title).toBe('User 1 Meeting');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/meetings/recent')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access denied. No token provided.');
    });

    it('should fail with invalid limit parameter', async () => {
      const user = await createTestUser();
      const token = generateToken((user._id as Types.ObjectId).toString());

      const response = await request(app)
        .get('/api/meetings/recent?limit=100')
        .set('Authorization', `Bearer ${token}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should return empty array when user has no meetings', async () => {
      const user = await createTestUser();
      const token = generateToken((user._id as Types.ObjectId).toString());

      const response = await request(app)
        .get('/api/meetings/recent')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.data.meetings).toHaveLength(0);
      expect(response.body.data.meetings).toEqual([]);
      expect(response.body.data.total).toBe(0);
    });
  });

  describe('POST /api/meetings/join', () => {
    it('should join a meeting successfully', async () => {
      const user = await createTestUser();
      const token = generateToken((user._id as Types.ObjectId).toString());
      const meeting = await createTestMeeting(user._id as Types.ObjectId, { title: 'Test Meeting' });

      const response = await request(app)
        .post('/api/meetings/join')
        .set('Authorization', `Bearer ${token}`)
        .send({
          meetingCode: meeting.meetingCode,
          name: 'John Doe',
        })
        .expect(200);

      expect(response.body).toHaveProperty('meetingId');
      expect(response.body).toHaveProperty('roomToken');
      expect(response.body).toHaveProperty('participants');
      expect(response.body.participants).toBeInstanceOf(Array);
    });

    it('should add user to participants when joining', async () => {
      const user = await createTestUser();
      const token = generateToken((user._id as Types.ObjectId).toString());
      const meeting = await createTestMeeting(user._id as Types.ObjectId);

      await request(app)
        .post('/api/meetings/join')
        .set('Authorization', `Bearer ${token}`)
        .send({ meetingCode: meeting.meetingCode })
        .expect(200);

      const updatedMeeting = await Meeting.findById(meeting._id);
      expect(updatedMeeting?.participants).toHaveLength(1);
      expect(updatedMeeting?.participants[0].userId?.toString()).toBe((user._id as Types.ObjectId).toString());
    });

    it('should not add duplicate participant if user joins again', async () => {
      const user = await createTestUser();
      const token = generateToken((user._id as Types.ObjectId).toString());
      const meeting = await createTestMeeting(user._id as Types.ObjectId);

      // Join first time
      await request(app)
        .post('/api/meetings/join')
        .set('Authorization', `Bearer ${token}`)
        .send({ meetingCode: meeting.meetingCode })
        .expect(200);

      // Join second time
      await request(app)
        .post('/api/meetings/join')
        .set('Authorization', `Bearer ${token}`)
        .send({ meetingCode: meeting.meetingCode })
        .expect(200);

      const updatedMeeting = await Meeting.findById(meeting._id);
      expect(updatedMeeting?.participants).toHaveLength(1);
    });

    it('should update meeting status to active when first user joins', async () => {
      const user = await createTestUser();
      const token = generateToken((user._id as Types.ObjectId).toString());
      const meeting = await createTestMeeting(user._id as Types.ObjectId, { status: 'scheduled' });

      await request(app)
        .post('/api/meetings/join')
        .set('Authorization', `Bearer ${token}`)
        .send({ meetingCode: meeting.meetingCode })
        .expect(200);

      const updatedMeeting = await Meeting.findById(meeting._id);
      expect(updatedMeeting?.status).toBe('active');
      expect(updatedMeeting?.startedAt).toBeDefined();
    });

    it('should use provided name for participant', async () => {
      const user = await createTestUser();
      const token = generateToken((user._id as Types.ObjectId).toString());
      const meeting = await createTestMeeting(user._id as Types.ObjectId);

      await request(app)
        .post('/api/meetings/join')
        .set('Authorization', `Bearer ${token}`)
        .send({
          meetingCode: meeting.meetingCode,
          name: 'Custom Name',
        })
        .expect(200);

      const updatedMeeting = await Meeting.findById(meeting._id);
      expect(updatedMeeting?.participants[0].name).toBe('Custom Name');
    });

    it('should use user name from auth if name not provided', async () => {
      const user = await createTestUser({ name: 'Auth User' });
      const token = generateToken((user._id as Types.ObjectId).toString());
      const meeting = await createTestMeeting(user._id as Types.ObjectId);

      await request(app)
        .post('/api/meetings/join')
        .set('Authorization', `Bearer ${token}`)
        .send({ meetingCode: meeting.meetingCode })
        .expect(200);

      const updatedMeeting = await Meeting.findById(meeting._id);
      expect(updatedMeeting?.participants[0].name).toBe('Auth User');
    });

    it('should return active participants only', async () => {
      const user1 = await createTestUser({ email: 'user1@example.com' });
      const user2 = await createTestUser({ email: 'user2@example.com' });
      const token1 = generateToken((user1._id as Types.ObjectId).toString());
      const token2 = generateToken((user2._id as Types.ObjectId).toString());

      const meeting = await createTestMeeting(user1._id as Types.ObjectId);

      // User 1 joins
      await request(app)
        .post('/api/meetings/join')
        .set('Authorization', `Bearer ${token1}`)
        .send({ meetingCode: meeting.meetingCode })
        .expect(200);

      // User 2 joins
      const response = await request(app)
        .post('/api/meetings/join')
        .set('Authorization', `Bearer ${token2}`)
        .send({ meetingCode: meeting.meetingCode })
        .expect(200);

      expect(response.body.participants).toHaveLength(2);
    });

    it('should fail with invalid meeting code', async () => {
      const user = await createTestUser();
      const token = generateToken((user._id as Types.ObjectId).toString());

      const response = await request(app)
        .post('/api/meetings/join')
        .set('Authorization', `Bearer ${token}`)
        .send({ meetingCode: 'INVALID123' })
        .expect(404);

      expect(response.body.message).toBe('Meeting not found');
    });

    it('should fail if meeting has ended', async () => {
      const user = await createTestUser();
      const token = generateToken((user._id as Types.ObjectId).toString());
      const meeting = await createTestMeeting(user._id as Types.ObjectId, { status: 'ended' });

      const response = await request(app)
        .post('/api/meetings/join')
        .set('Authorization', `Bearer ${token}`)
        .send({ meetingCode: meeting.meetingCode })
        .expect(400);

      expect(response.body.message).toBe('Meeting has ended');
    });

    it('should fail without authentication', async () => {
      const user = await createTestUser();
      const meeting = await createTestMeeting(user._id as Types.ObjectId);

      const response = await request(app)
        .post('/api/meetings/join')
        .send({ meetingCode: meeting.meetingCode })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access denied. No token provided.');
    });

    it('should fail with invalid token', async () => {
      const user = await createTestUser();
      const meeting = await createTestMeeting(user._id as Types.ObjectId);

      const response = await request(app)
        .post('/api/meetings/join')
        .set('Authorization', 'Bearer invalid-token')
        .send({ meetingCode: meeting.meetingCode })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid or expired token.');
    });

    it('should fail without meeting code', async () => {
      const user = await createTestUser();
      const token = generateToken((user._id as Types.ObjectId).toString());

      const response = await request(app)
        .post('/api/meetings/join')
        .set('Authorization', `Bearer ${token}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should fail with invalid name length', async () => {
      const user = await createTestUser();
      const token = generateToken((user._id as Types.ObjectId).toString());
      const meeting = await createTestMeeting(user._id as Types.ObjectId);

      const response = await request(app)
        .post('/api/meetings/join')
        .set('Authorization', `Bearer ${token}`)
        .send({
          meetingCode: meeting.meetingCode,
          name: 'A',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should fail with invalid settings type', async () => {
      const user = await createTestUser();
      const token = generateToken((user._id as Types.ObjectId).toString());
      const meeting = await createTestMeeting(user._id as Types.ObjectId);

      const response = await request(app)
        .post('/api/meetings/join')
        .set('Authorization', `Bearer ${token}`)
        .send({
          meetingCode: meeting.meetingCode,
          settings: 'invalid',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should generate unique room tokens', async () => {
      const user = await createTestUser();
      const token = generateToken((user._id as Types.ObjectId).toString());
      const meeting = await createTestMeeting(user._id as Types.ObjectId);

      const response1 = await request(app)
        .post('/api/meetings/join')
        .set('Authorization', `Bearer ${token}`)
        .send({ meetingCode: meeting.meetingCode })
        .expect(200);

      // Create a new user and meeting
      const user2 = await createTestUser({ email: 'user2@example.com' });
      const token2 = generateToken((user2._id as Types.ObjectId).toString());
      const meeting2 = await createTestMeeting(user2._id as Types.ObjectId);

      const response2 = await request(app)
        .post('/api/meetings/join')
        .set('Authorization', `Bearer ${token2}`)
        .send({ meetingCode: meeting2.meetingCode })
        .expect(200);

      expect(response1.body.roomToken).not.toBe(response2.body.roomToken);
    });
  });

  describe('POST /api/meetings/:id/start', () => {
    it('should start a scheduled meeting successfully', async () => {
      const user = await createTestUser();
      const token = generateToken((user._id as Types.ObjectId).toString());
      const meeting = await createTestMeeting(user._id as Types.ObjectId, { status: 'scheduled' });

      const response = await request(app)
        .post(`/api/meetings/${meeting._id}/start`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('meetingId');
      expect(response.body).toHaveProperty('meetingLink');
      expect(response.body).toHaveProperty('status');
      expect(response.body.status).toBe('active');
    });

    it('should update meeting status to active', async () => {
      const user = await createTestUser();
      const token = generateToken((user._id as Types.ObjectId).toString());
      const meeting = await createTestMeeting(user._id as Types.ObjectId, { status: 'scheduled' });

      await request(app)
        .post(`/api/meetings/${meeting._id}/start`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const updatedMeeting = await Meeting.findById(meeting._id);
      expect(updatedMeeting?.status).toBe('active');
      expect(updatedMeeting?.startedAt).toBeDefined();
    });

    it('should work with already active meeting', async () => {
      const user = await createTestUser();
      const token = generateToken((user._id as Types.ObjectId).toString());
      const meeting = await createTestMeeting(user._id as Types.ObjectId, { status: 'active' });

      const response = await request(app)
        .post(`/api/meetings/${meeting._id}/start`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.status).toBe('active');
    });

    it('should return correct meeting link', async () => {
      const user = await createTestUser();
      const token = generateToken((user._id as Types.ObjectId).toString());
      const meeting = await createTestMeeting(user._id as Types.ObjectId);

      const response = await request(app)
        .post(`/api/meetings/${meeting._id}/start`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.meetingLink).toContain(`/meeting/${meeting._id}`);
    });

    it('should fail with invalid meeting ID', async () => {
      const user = await createTestUser();
      const token = generateToken((user._id as Types.ObjectId).toString());

      const response = await request(app)
        .post('/api/meetings/invalid-id/start')
        .set('Authorization', `Bearer ${token}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should fail with non-existent meeting ID', async () => {
      const user = await createTestUser();
      const token = generateToken((user._id as Types.ObjectId).toString());
      const nonExistentId = new Types.ObjectId();

      const response = await request(app)
        .post(`/api/meetings/${nonExistentId}/start`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(response.body.message).toBe('Meeting not found');
    });

    it('should fail if user is not the host', async () => {
      const host = await createTestUser({ email: 'host@example.com' });
      const otherUser = await createTestUser({ email: 'other@example.com' });
      const token = generateToken((otherUser._id as Types.ObjectId).toString());
      const meeting = await createTestMeeting(host._id as Types.ObjectId);

      const response = await request(app)
        .post(`/api/meetings/${meeting._id}/start`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      expect(response.body.message).toBe('Only the host can start the meeting');
    });

    it('should fail if meeting has ended', async () => {
      const user = await createTestUser();
      const token = generateToken((user._id as Types.ObjectId).toString());
      const meeting = await createTestMeeting(user._id as Types.ObjectId, { status: 'ended' });

      const response = await request(app)
        .post(`/api/meetings/${meeting._id}/start`)
        .set('Authorization', `Bearer ${token}`)
        .expect(400);

      expect(response.body.message).toBe('Meeting has already ended');
    });

    it('should fail without authentication', async () => {
      const user = await createTestUser();
      const meeting = await createTestMeeting(user._id as Types.ObjectId);

      const response = await request(app)
        .post(`/api/meetings/${meeting._id}/start`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access denied. No token provided.');
    });

    it('should fail with invalid token', async () => {
      const user = await createTestUser();
      const meeting = await createTestMeeting(user._id as Types.ObjectId);

      const response = await request(app)
        .post(`/api/meetings/${meeting._id}/start`)
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid or expired token.');
    });

    it('should only allow host to start meeting', async () => {
      const user = await createTestUser();
      const token = generateToken((user._id as Types.ObjectId).toString());
      const meeting = await createTestMeeting(user._id as Types.ObjectId);

      const response = await request(app)
        .post(`/api/meetings/${meeting._id}/start`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.meetingId).toBe(meeting._id.toString());
    });

    it('should set startedAt timestamp when starting scheduled meeting', async () => {
      const user = await createTestUser();
      const token = generateToken((user._id as Types.ObjectId).toString());
      const meeting = await createTestMeeting(user._id as Types.ObjectId, { status: 'scheduled' });

      const beforeStart = new Date();

      await request(app)
        .post(`/api/meetings/${meeting._id}/start`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const updatedMeeting = await Meeting.findById(meeting._id);
      expect(updatedMeeting?.startedAt).toBeDefined();
      expect(updatedMeeting?.startedAt!.getTime()).toBeGreaterThanOrEqual(beforeStart.getTime());
    });

    it('should not change startedAt if meeting already active', async () => {
      const user = await createTestUser();
      const token = generateToken((user._id as Types.ObjectId).toString());
      const originalStartTime = new Date();
      const meeting = await createTestMeeting(user._id as Types.ObjectId, {
        status: 'active',
        startedAt: originalStartTime
      });

      await new Promise(resolve => setTimeout(resolve, 10));

      await request(app)
        .post(`/api/meetings/${meeting._id}/start`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const updatedMeeting = await Meeting.findById(meeting._id);
      expect(updatedMeeting?.startedAt?.getTime()).toBe(originalStartTime.getTime());
    });
  });

  describe('GET /api/meetings/:id', () => {
    it('should get meeting details by ID successfully', async () => {
      const user = await createTestUser();
      const token = generateToken((user._id as Types.ObjectId).toString());
      const meeting = await createTestMeeting(user._id as Types.ObjectId, { title: 'Test Meeting' });

      const response = await request(app)
        .get(`/api/meetings/${meeting._id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.meeting).toHaveProperty('_id');
      expect(response.body.meeting).toHaveProperty('title');
      expect(response.body.meeting).toHaveProperty('code');
      expect(response.body.meeting).toHaveProperty('link');
      expect(response.body.meeting).toHaveProperty('host');
      expect(response.body.meeting).toHaveProperty('participants');
      expect(response.body.meeting).toHaveProperty('status');
      expect(response.body.meeting).toHaveProperty('createdAt');
    });

    it('should get meeting details by meeting code successfully', async () => {
      const user = await createTestUser();
      const token = generateToken((user._id as Types.ObjectId).toString());
      const meeting = await createTestMeeting(user._id as Types.ObjectId, { title: 'Test Meeting' });

      const response = await request(app)
        .get(`/api/meetings/${meeting.meetingCode}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.meeting._id).toBe(meeting._id.toString());
      expect(response.body.meeting.code).toBe(meeting.meetingCode);
    });

    it('should return correct meeting details structure', async () => {
      const user = await createTestUser({ name: 'John Doe', email: 'john@example.com' });
      const token = generateToken((user._id as Types.ObjectId).toString());
      const meeting = await createTestMeeting(user._id as Types.ObjectId, { title: 'Team Meeting' });

      const response = await request(app)
        .get(`/api/meetings/${meeting._id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.meeting.title).toBe('Team Meeting');
      expect(response.body.meeting.host.name).toBe('John Doe');
      expect(response.body.meeting.host.email).toBe('john@example.com');
      expect(response.body.meeting.participants).toBeInstanceOf(Array);
    });

    it('should include participants in meeting details', async () => {
      const host = await createTestUser({ email: 'host@example.com' });
      const participant = await createTestUser({ email: 'participant@example.com' });
      const hostToken = generateToken((host._id as Types.ObjectId).toString());
      const participantToken = generateToken((participant._id as Types.ObjectId).toString());

      const meeting = await createTestMeeting(host._id as Types.ObjectId);

      // Participant joins meeting
      await request(app)
        .post('/api/meetings/join')
        .set('Authorization', `Bearer ${participantToken}`)
        .send({ meetingCode: meeting.meetingCode })
        .expect(200);

      const response = await request(app)
        .get(`/api/meetings/${meeting._id}`)
        .set('Authorization', `Bearer ${hostToken}`)
        .expect(200);

      expect(response.body.meeting.participants).toHaveLength(1);
      expect(response.body.meeting.participants[0]).toHaveProperty('userId');
      expect(response.body.meeting.participants[0]).toHaveProperty('name');
      expect(response.body.meeting.participants[0]).toHaveProperty('joinedAt');
    });

    it('should return meeting link', async () => {
      const user = await createTestUser();
      const token = generateToken((user._id as Types.ObjectId).toString());
      const meeting = await createTestMeeting(user._id as Types.ObjectId);

      const response = await request(app)
        .get(`/api/meetings/${meeting._id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.meeting.link).toContain(`/meeting/${meeting._id}`);
    });

    it('should include startedAt and endedAt timestamps when present', async () => {
      const user = await createTestUser();
      const token = generateToken((user._id as Types.ObjectId).toString());
      const startTime = new Date();
      const endTime = new Date();
      const meeting = await createTestMeeting(user._id as Types.ObjectId, {
        status: 'ended',
        startedAt: startTime,
        endedAt: endTime
      });

      const response = await request(app)
        .get(`/api/meetings/${meeting._id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.meeting.startedAt).toBeDefined();
      expect(response.body.meeting.endedAt).toBeDefined();
    });

    it('should fail with non-existent meeting ID', async () => {
      const user = await createTestUser();
      const token = generateToken((user._id as Types.ObjectId).toString());
      const nonExistentId = new Types.ObjectId();

      const response = await request(app)
        .get(`/api/meetings/${nonExistentId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(response.body.message).toBe('Meeting not found');
    });

    it('should fail with non-existent meeting code', async () => {
      const user = await createTestUser();
      const token = generateToken((user._id as Types.ObjectId).toString());

      const response = await request(app)
        .get('/api/meetings/INVALID123')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(response.body.message).toBe('Meeting not found');
    });

    it('should fail without authentication', async () => {
      const user = await createTestUser();
      const meeting = await createTestMeeting(user._id as Types.ObjectId);

      const response = await request(app)
        .get(`/api/meetings/${meeting._id}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access denied. No token provided.');
    });

    it('should fail with invalid token', async () => {
      const user = await createTestUser();
      const meeting = await createTestMeeting(user._id as Types.ObjectId);

      const response = await request(app)
        .get(`/api/meetings/${meeting._id}`)
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid or expired token.');
    });

    it('should return host information with populated fields', async () => {
      const user = await createTestUser({ name: 'Host User', email: 'host@example.com' });
      const token = generateToken((user._id as Types.ObjectId).toString());
      const meeting = await createTestMeeting(user._id as Types.ObjectId);

      const response = await request(app)
        .get(`/api/meetings/${meeting._id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.meeting.host._id).toBe((user._id as Types.ObjectId).toString());
      expect(response.body.meeting.host.name).toBe('Host User');
      expect(response.body.meeting.host.email).toBe('host@example.com');
    });

    it('should work for any authenticated user, not just host', async () => {
      const host = await createTestUser({ email: 'host@example.com' });
      const otherUser = await createTestUser({ email: 'other@example.com' });
      const otherToken = generateToken((otherUser._id as Types.ObjectId).toString());
      const meeting = await createTestMeeting(host._id as Types.ObjectId);

      const response = await request(app)
        .get(`/api/meetings/${meeting._id}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(200);

      expect(response.body.meeting._id).toBe(meeting._id.toString());
    });

    it('should include all meeting statuses correctly', async () => {
      const user = await createTestUser();
      const token = generateToken((user._id as Types.ObjectId).toString());

      const scheduledMeeting = await createTestMeeting(user._id as Types.ObjectId, { status: 'scheduled' });
      const activeMeeting = await createTestMeeting(user._id as Types.ObjectId, { status: 'active' });
      const endedMeeting = await createTestMeeting(user._id as Types.ObjectId, { status: 'ended' });

      const response1 = await request(app)
        .get(`/api/meetings/${scheduledMeeting._id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const response2 = await request(app)
        .get(`/api/meetings/${activeMeeting._id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const response3 = await request(app)
        .get(`/api/meetings/${endedMeeting._id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response1.body.meeting.status).toBe('scheduled');
      expect(response2.body.meeting.status).toBe('active');
      expect(response3.body.meeting.status).toBe('ended');
    });
  });

  describe('POST /api/meetings/:id/leave', () => {
    it('should leave meeting successfully', async () => {
      const user = await createTestUser();
      const token = generateToken((user._id as Types.ObjectId).toString());
      const meeting = await createTestMeeting(user._id as Types.ObjectId);

      // Join the meeting first
      await request(app)
        .post('/api/meetings/join')
        .set('Authorization', `Bearer ${token}`)
        .send({ meetingCode: meeting.meetingCode })
        .expect(200);

      const response = await request(app)
        .post(`/api/meetings/${meeting._id}/leave`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Left meeting successfully');
    });

    it('should update participant leftAt timestamp', async () => {
      const user = await createTestUser();
      const token = generateToken((user._id as Types.ObjectId).toString());
      const meeting = await createTestMeeting(user._id as Types.ObjectId);

      // Join the meeting
      await request(app)
        .post('/api/meetings/join')
        .set('Authorization', `Bearer ${token}`)
        .send({ meetingCode: meeting.meetingCode })
        .expect(200);

      const beforeLeave = new Date();

      await request(app)
        .post(`/api/meetings/${meeting._id}/leave`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const updatedMeeting = await Meeting.findById(meeting._id);
      const participant = updatedMeeting?.participants.find(
        (p) => p.userId?.toString() === (user._id as Types.ObjectId).toString()
      );

      expect(participant?.leftAt).toBeDefined();
      expect(participant?.leftAt!.getTime()).toBeGreaterThanOrEqual(beforeLeave.getTime());
    });

    it('should fail if user is not a participant', async () => {
      const host = await createTestUser({ email: 'host@example.com' });
      const otherUser = await createTestUser({ email: 'other@example.com' });
      const token = generateToken((otherUser._id as Types.ObjectId).toString());
      const meeting = await createTestMeeting(host._id as Types.ObjectId);

      const response = await request(app)
        .post(`/api/meetings/${meeting._id}/leave`)
        .set('Authorization', `Bearer ${token}`)
        .expect(400);

      expect(response.body.message).toBe('You are not a participant in this meeting');
    });

    it('should fail with invalid meeting ID', async () => {
      const user = await createTestUser();
      const token = generateToken((user._id as Types.ObjectId).toString());

      const response = await request(app)
        .post('/api/meetings/invalid-id/leave')
        .set('Authorization', `Bearer ${token}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should fail with non-existent meeting ID', async () => {
      const user = await createTestUser();
      const token = generateToken((user._id as Types.ObjectId).toString());
      const nonExistentId = new Types.ObjectId();

      const response = await request(app)
        .post(`/api/meetings/${nonExistentId}/leave`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(response.body.message).toBe('Meeting not found');
    });

    it('should fail without authentication', async () => {
      const user = await createTestUser();
      const meeting = await createTestMeeting(user._id as Types.ObjectId);

      const response = await request(app)
        .post(`/api/meetings/${meeting._id}/leave`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access denied. No token provided.');
    });

    it('should fail with invalid token', async () => {
      const user = await createTestUser();
      const meeting = await createTestMeeting(user._id as Types.ObjectId);

      const response = await request(app)
        .post(`/api/meetings/${meeting._id}/leave`)
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid or expired token.');
    });
  });

  describe('POST /api/meetings/:id/end', () => {
    it('should end meeting successfully as host', async () => {
      const user = await createTestUser();
      const token = generateToken((user._id as Types.ObjectId).toString());
      const meeting = await createTestMeeting(user._id as Types.ObjectId, { status: 'active' });

      const response = await request(app)
        .post(`/api/meetings/${meeting._id}/end`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Meeting ended successfully');
    });

    it('should update meeting status to ended', async () => {
      const user = await createTestUser();
      const token = generateToken((user._id as Types.ObjectId).toString());
      const meeting = await createTestMeeting(user._id as Types.ObjectId, { status: 'active' });

      await request(app)
        .post(`/api/meetings/${meeting._id}/end`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const updatedMeeting = await Meeting.findById(meeting._id);
      expect(updatedMeeting?.status).toBe('ended');
      expect(updatedMeeting?.endedAt).toBeDefined();
    });

    it('should set endedAt timestamp', async () => {
      const user = await createTestUser();
      const token = generateToken((user._id as Types.ObjectId).toString());
      const meeting = await createTestMeeting(user._id as Types.ObjectId, { status: 'active' });

      const beforeEnd = new Date();

      await request(app)
        .post(`/api/meetings/${meeting._id}/end`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const updatedMeeting = await Meeting.findById(meeting._id);
      expect(updatedMeeting?.endedAt).toBeDefined();
      expect(updatedMeeting?.endedAt!.getTime()).toBeGreaterThanOrEqual(beforeEnd.getTime());
    });

    it('should fail if user is not the host', async () => {
      const host = await createTestUser({ email: 'host@example.com' });
      const otherUser = await createTestUser({ email: 'other@example.com' });
      const token = generateToken((otherUser._id as Types.ObjectId).toString());
      const meeting = await createTestMeeting(host._id as Types.ObjectId);

      const response = await request(app)
        .post(`/api/meetings/${meeting._id}/end`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      expect(response.body.message).toBe('Only the host can end the meeting');
    });

    it('should fail if meeting has already ended', async () => {
      const user = await createTestUser();
      const token = generateToken((user._id as Types.ObjectId).toString());
      const meeting = await createTestMeeting(user._id as Types.ObjectId, { status: 'ended' });

      const response = await request(app)
        .post(`/api/meetings/${meeting._id}/end`)
        .set('Authorization', `Bearer ${token}`)
        .expect(400);

      expect(response.body.message).toBe('Meeting has already ended');
    });

    it('should fail with invalid meeting ID', async () => {
      const user = await createTestUser();
      const token = generateToken((user._id as Types.ObjectId).toString());

      const response = await request(app)
        .post('/api/meetings/invalid-id/end')
        .set('Authorization', `Bearer ${token}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should fail with non-existent meeting ID', async () => {
      const user = await createTestUser();
      const token = generateToken((user._id as Types.ObjectId).toString());
      const nonExistentId = new Types.ObjectId();

      const response = await request(app)
        .post(`/api/meetings/${nonExistentId}/end`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(response.body.message).toBe('Meeting not found');
    });

    it('should fail without authentication', async () => {
      const user = await createTestUser();
      const meeting = await createTestMeeting(user._id as Types.ObjectId);

      const response = await request(app)
        .post(`/api/meetings/${meeting._id}/end`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access denied. No token provided.');
    });

    it('should fail with invalid token', async () => {
      const user = await createTestUser();
      const meeting = await createTestMeeting(user._id as Types.ObjectId);

      const response = await request(app)
        .post(`/api/meetings/${meeting._id}/end`)
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid or expired token.');
    });

    it('should allow host to end scheduled meeting', async () => {
      const user = await createTestUser();
      const token = generateToken((user._id as Types.ObjectId).toString());
      const meeting = await createTestMeeting(user._id as Types.ObjectId, { status: 'scheduled' });

      const response = await request(app)
        .post(`/api/meetings/${meeting._id}/end`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      const updatedMeeting = await Meeting.findById(meeting._id);
      expect(updatedMeeting?.status).toBe('ended');
    });
  });
});
