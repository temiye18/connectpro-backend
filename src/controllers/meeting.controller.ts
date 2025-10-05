import { Response } from 'express';
import { Meeting, IMeeting } from '../models/meeting.model';
import { IUser } from '../models/user.model';
import { Types } from 'mongoose';
import crypto from 'crypto';
import { AuthRequest } from '../middleware/auth.middleware';

// Type for populated meeting
interface IPopulatedMeeting extends Omit<IMeeting, 'host'> {
  host: IUser;
}

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

// @desc    Get recent meetings
// @route   GET /api/meetings/recent
// @access  Private
export const getRecentMeetings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const limit = parseInt(req.query.limit as string) || 10;

    if (!userId) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    // Fetch recent meetings for the user (as host)
    const meetings = await Meeting.find({ host: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('_id title createdAt meetingCode status')
      .lean();

    // Format response
    const formattedMeetings = meetings.map((meeting) => ({
      _id: meeting._id.toString(),
      title: meeting.title,
      date: meeting.createdAt,
      meetingCode: meeting.meetingCode,
      status: meeting.status,
    }));

    res.status(200).json({
      meetings: formattedMeetings,
    });
  } catch (error) {
    console.error('Get recent meetings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Join a meeting
// @route   POST /api/meetings/join
// @access  Private
export const joinMeeting = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { meetingCode, name, settings } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    // Find meeting by code
    const meeting = await Meeting.findOne({ meetingCode });

    if (!meeting) {
      res.status(404).json({ message: 'Meeting not found' });
      return;
    }

    // Check if meeting has ended
    if (meeting.status === 'ended') {
      res.status(400).json({ message: 'Meeting has ended' });
      return;
    }

    // Check if user is already a participant
    const existingParticipant = meeting.participants.find(
      (p) => p.userId && (p.userId as Types.ObjectId).toString() === userId
    );

    if (!existingParticipant) {
      // Add user to participants
      meeting.participants.push({
        userId: new Types.ObjectId(userId),
        name: name || req.user?.name || 'Guest',
        joinedAt: new Date(),
      });

      // Update meeting status to active if it was scheduled
      if (meeting.status === 'scheduled') {
        meeting.status = 'active';
        meeting.startedAt = new Date();
      }

      await meeting.save();
    }

    // Generate room token (simple implementation - can be enhanced with JWT)
    const roomToken = crypto.randomBytes(32).toString('hex');

    // Get all active participants (those who haven't left)
    const activeParticipants = meeting.participants
      .filter((p) => !p.leftAt)
      .map((p) => ({
        userId: p.userId?.toString(),
        name: p.name,
        joinedAt: p.joinedAt,
      }));

    res.status(200).json({
      meetingId: meeting._id.toString(),
      roomToken,
      participants: activeParticipants,
    });
  } catch (error) {
    console.error('Join meeting error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Start an existing meeting
// @route   POST /api/meetings/:id/start
// @access  Private
export const startMeeting = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    // Validate ObjectId
    if (!Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: 'Invalid meeting ID' });
      return;
    }

    // Find meeting by ID
    const meeting = await Meeting.findById(id);

    if (!meeting) {
      res.status(404).json({ message: 'Meeting not found' });
      return;
    }

    // Check if user is the host
    if (meeting.host.toString() !== userId) {
      res.status(403).json({ message: 'Only the host can start the meeting' });
      return;
    }

    // Check if meeting has already ended
    if (meeting.status === 'ended') {
      res.status(400).json({ message: 'Meeting has already ended' });
      return;
    }

    // Update meeting status to active if not already active
    if (meeting.status !== 'active') {
      meeting.status = 'active';
      meeting.startedAt = new Date();
      await meeting.save();
    }

    // Generate meeting link
    const meetingLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/meeting/${meeting._id}`;

    res.status(200).json({
      meetingId: meeting._id.toString(),
      meetingLink,
      status: meeting.status,
    });
  } catch (error) {
    console.error('Start meeting error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get meeting details by ID or code
// @route   GET /api/meetings/:id
// @access  Private
export const getMeetingDetails = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    let meeting: IPopulatedMeeting | null;

    // Check if id is a valid ObjectId or treat it as meeting code
    if (Types.ObjectId.isValid(id)) {
      meeting = await Meeting.findById(id).populate('host', 'name email') as IPopulatedMeeting | null;
    } else {
      // Try to find by meeting code
      meeting = await Meeting.findOne({ meetingCode: id }).populate('host', 'name email') as IPopulatedMeeting | null;
    }

    if (!meeting) {
      res.status(404).json({ message: 'Meeting not found' });
      return;
    }

    // Generate meeting link
    const meetingLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/meeting/${meeting._id}`;

    // Format participants
    const participants = meeting.participants.map((p) => ({
      userId: p.userId?.toString(),
      name: p.name,
      joinedAt: p.joinedAt,
      leftAt: p.leftAt,
    }));

    res.status(200).json({
      meeting: {
        _id: meeting._id.toString(),
        title: meeting.title,
        code: meeting.meetingCode,
        link: meetingLink,
        host: {
          _id: (meeting.host._id as Types.ObjectId).toString(),
          name: meeting.host.name,
          email: meeting.host.email,
        },
        participants,
        status: meeting.status,
        createdAt: meeting.createdAt,
        startedAt: meeting.startedAt,
        endedAt: meeting.endedAt,
      },
    });
  } catch (error) {
    console.error('Get meeting details error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
