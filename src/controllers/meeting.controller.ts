import { Response } from 'express';
import { Meeting } from '../models/meeting.model';
import { Types } from 'mongoose';
import crypto from 'crypto';
import { AuthRequest } from '../middleware/auth.middleware';

// Generate unique meeting code
const generateMeetingCode = (): string => {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
};

// @desc    Create a new meeting
// @route   POST /api/meetings
// @access  Private
export const createMeeting = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, settings } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    // Generate unique meeting code
    let meetingCode = generateMeetingCode();
    let existingMeeting = await Meeting.findOne({ meetingCode });

    // Ensure code is unique
    while (existingMeeting) {
      meetingCode = generateMeetingCode();
      existingMeeting = await Meeting.findOne({ meetingCode });
    }

    // Create meeting
    const meeting = await Meeting.create({
      title: title || 'Instant Meeting',
      meetingCode,
      host: new Types.ObjectId(userId),
      settings: {
        camera: settings?.camera ?? true,
        microphone: settings?.microphone ?? true,
      },
      status: 'scheduled',
    });

    // Generate meeting link
    const meetingLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/meeting/${meeting._id}`;

    res.status(201).json({
      meetingId: meeting._id.toString(),
      meetingLink,
      meetingCode: meeting.meetingCode,
      createdAt: meeting.createdAt,
    });
  } catch (error) {
    console.error('Create meeting error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
