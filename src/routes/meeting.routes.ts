import { Router } from 'express';
import { body } from 'express-validator';
import { createMeeting } from '../controllers/meeting.controller';
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

// Routes
router.post('/', authMiddleware, createMeetingValidation, validate, createMeeting);

export default router;
