import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IMeeting extends Document {
  _id: Types.ObjectId;
  title: string;
  meetingCode: string;
  host: Types.ObjectId;
  participants: Array<{
    userId: Types.ObjectId;
    name: string;
    joinedAt: Date;
    leftAt?: Date;
  }>;
  settings: {
    camera: boolean;
    microphone: boolean;
  };
  status: 'scheduled' | 'active' | 'ended';
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date;
  endedAt?: Date;
}

const meetingSchema = new Schema<IMeeting>(
  {
    title: {
      type: String,
      default: 'Instant Meeting',
    },
    meetingCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    host: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    participants: [
      {
        userId: {
          type: Schema.Types.ObjectId,
          ref: 'User',
        },
        name: {
          type: String,
          required: true,
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
        leftAt: {
          type: Date,
        },
      },
    ],
    settings: {
      camera: {
        type: Boolean,
        default: true,
      },
      microphone: {
        type: Boolean,
        default: true,
      },
    },
    status: {
      type: String,
      enum: ['scheduled', 'active', 'ended'],
      default: 'scheduled',
    },
    startedAt: {
      type: Date,
    },
    endedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export const Meeting = mongoose.model<IMeeting>('Meeting', meetingSchema);
