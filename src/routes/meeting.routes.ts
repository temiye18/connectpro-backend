import { Router } from 'express';
import { body, query, param } from 'express-validator';
import { createMeeting, getRecentMeetings, joinMeeting, startMeeting, getMeetingDetails, leaveMeeting, endMeeting } from '../controllers/meeting.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';

const router = Router();

// Validation rules
const createMeetingValidation = [
  body('title').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Title must be between 1 and 100 characters'),
  body('settings').optional().isObject().withMessage('Settings must be an object'),
  body('settings.camera').optional().isBoolean().withMessage('Camera setting must be a boolean'),
  body('settings.microphone').optional().isBoolean().withMessage('Microphone setting must be a boolean'),
];

const getRecentMeetingsValidation = [
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
];

const joinMeetingValidation = [
  body('meetingCode').notEmpty().withMessage('Meeting code is required').isString().withMessage('Meeting code must be a string'),
  body('name').optional().trim().isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
  body('settings').optional().isObject().withMessage('Settings must be an object'),
  body('settings.camera').optional().isBoolean().withMessage('Camera setting must be a boolean'),
  body('settings.microphone').optional().isBoolean().withMessage('Microphone setting must be a boolean'),
];

const startMeetingValidation = [
  param('id').notEmpty().withMessage('Meeting ID is required').isMongoId().withMessage('Invalid meeting ID'),
];

const getMeetingDetailsValidation = [
  param('id').notEmpty().withMessage('Meeting ID or code is required'),
];

const leaveMeetingValidation = [
  param('id').notEmpty().withMessage('Meeting ID is required').isMongoId().withMessage('Invalid meeting ID'),
];

const endMeetingValidation = [
  param('id').notEmpty().withMessage('Meeting ID is required').isMongoId().withMessage('Invalid meeting ID'),
];

// Routes
router.post('/', authMiddleware, createMeetingValidation, validate, createMeeting);
router.get('/recent', authMiddleware, getRecentMeetingsValidation, validate, getRecentMeetings);
router.post('/join', authMiddleware, joinMeetingValidation, validate, joinMeeting);
router.post('/:id/start', authMiddleware, startMeetingValidation, validate, startMeeting);
router.post('/:id/leave', authMiddleware, leaveMeetingValidation, validate, leaveMeeting);
router.post('/:id/end', authMiddleware, endMeetingValidation, validate, endMeeting);
router.get('/:id', authMiddleware, getMeetingDetailsValidation, validate, getMeetingDetails);

export default router;
