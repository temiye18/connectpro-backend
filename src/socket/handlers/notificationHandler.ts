import { Server } from 'socket.io';
import { AuthenticatedSocket } from '../socket';

export interface Notification {
  id: string;
  type: 'meeting-started' | 'meeting-ended' | 'participant-joined' | 'participant-left' | 'host-changed' | 'kicked' | 'info';
  meetingId: string;
  title: string;
  message: string;
  timestamp: string;
  data?: Record<string, unknown>;
}

export const handleNotificationEvents = (io: Server, socket: AuthenticatedSocket) => {
  // Meeting started notification
  socket.on('meeting-started', ({ meetingId, title }) => {
    try {
      const notification: Notification = {
        id: `notification_${Date.now()}_${socket.id}`,
        type: 'meeting-started',
        meetingId,
        title: 'Meeting Started',
        message: `${title || 'Meeting'} has started`,
        timestamp: new Date().toISOString(),
        data: {
          hostId: socket.user?.userId,
          hostName: socket.user?.name,
        },
      };

      io.in(meetingId).emit('notification', notification);

      console.log(`Meeting ${meetingId} started by ${socket.user?.name}`);
    } catch (error) {
      console.error('Error sending meeting started notification:', error);
    }
  });

  // Meeting ended notification
  socket.on('meeting-ended', ({ meetingId, reason }) => {
    try {
      const notification: Notification = {
        id: `notification_${Date.now()}_${socket.id}`,
        type: 'meeting-ended',
        meetingId,
        title: 'Meeting Ended',
        message: reason || 'The meeting has ended',
        timestamp: new Date().toISOString(),
        data: {
          endedBy: socket.user?.userId,
          endedByName: socket.user?.name,
        },
      };

      io.in(meetingId).emit('notification', notification);
      io.in(meetingId).emit('meeting-ended', {
        meetingId,
        endedBy: socket.user?.userId,
        endedByName: socket.user?.name,
        reason,
        timestamp: new Date().toISOString(),
      });

      console.log(`Meeting ${meetingId} ended by ${socket.user?.name}`);
    } catch (error) {
      console.error('Error sending meeting ended notification:', error);
    }
  });

  // Kick participant (host only)
  socket.on('kick-participant', ({ meetingId, targetUserId, targetSocketId, reason }) => {
    try {
      if (!targetSocketId) {
        socket.emit('notification-error', {
          message: 'Target socket ID is required',
        });
        return;
      }

      // Send kick notification to the target user
      io.to(targetSocketId).emit('kicked-from-meeting', {
        meetingId,
        kickedBy: socket.user?.userId,
        kickedByName: socket.user?.name,
        reason: reason || 'You have been removed from the meeting',
        timestamp: new Date().toISOString(),
      });

      // Notify other participants
      const notification: Notification = {
        id: `notification_${Date.now()}_${socket.id}`,
        type: 'kicked',
        meetingId,
        title: 'Participant Removed',
        message: `A participant was removed from the meeting`,
        timestamp: new Date().toISOString(),
        data: {
          removedBy: socket.user?.userId,
          removedByName: socket.user?.name,
        },
      };

      socket.to(meetingId).emit('notification', notification);

      console.log(`User ${targetUserId} kicked from meeting ${meetingId} by ${socket.user?.name}`);
    } catch (error) {
      console.error('Error kicking participant:', error);
      socket.emit('notification-error', {
        message: 'Failed to kick participant',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Send custom notification
  socket.on('send-notification', ({ meetingId, title, message, type = 'info' }) => {
    try {
      const notification: Notification = {
        id: `notification_${Date.now()}_${socket.id}`,
        type: type as Notification['type'],
        meetingId,
        title,
        message,
        timestamp: new Date().toISOString(),
        data: {
          sentBy: socket.user?.userId,
          sentByName: socket.user?.name,
        },
      };

      io.in(meetingId).emit('notification', notification);

      console.log(`Custom notification sent to meeting ${meetingId} by ${socket.user?.name}`);
    } catch (error) {
      console.error('Error sending custom notification:', error);
      socket.emit('notification-error', {
        message: 'Failed to send notification',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });
};
