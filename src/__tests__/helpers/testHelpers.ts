import { User, IUser } from '../../models/user.model';
import { Meeting, IMeeting } from '../../models/meeting.model';
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';

// Generate JWT token for testing
export const generateToken = (userId: string): string => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'your-secret-key', {
    expiresIn: '7d',
  });
};

// Create test user
export const createTestUser = async (userData?: Partial<IUser>): Promise<IUser> => {
  const defaultData = {
    email: `test${Date.now()}@example.com`,
    password: 'Test1234',
    name: 'Test User',
  };

  const user = await User.create({ ...defaultData, ...userData });
  return user;
};

// Create test meeting
export const createTestMeeting = async (
  hostId: Types.ObjectId,
  meetingData?: Partial<IMeeting>
): Promise<IMeeting> => {
  const defaultData = {
    title: 'Test Meeting',
    meetingCode: `TEST${Date.now().toString().slice(-6)}`,
    host: hostId,
    settings: {
      camera: true,
      microphone: true,
    },
    status: 'scheduled' as const,
  };

  const meeting = await Meeting.create({ ...defaultData, ...meetingData });
  return meeting;
};

// Clean up all collections
export const cleanupDatabase = async (): Promise<void> => {
  await User.deleteMany({});
  await Meeting.deleteMany({});
};
