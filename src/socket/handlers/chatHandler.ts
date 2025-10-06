import { Server } from 'socket.io';
import { AuthenticatedSocket } from '../socket';

export interface ChatMessage {
  id: string;
  meetingId: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: string;
  isGuest: boolean;
}

export const handleChatEvents = (io: Server, socket: AuthenticatedSocket) => {
  // Send chat message
  socket.on('send-message', ({ meetingId, message }) => {
    try {
      if (!message || typeof message !== 'string' || message.trim().length === 0) {
        socket.emit('chat-error', {
          message: 'Message cannot be empty',
        });
        return;
      }

      if (message.length > 1000) {
        socket.emit('chat-error', {
          message: 'Message is too long (max 1000 characters)',
        });
        return;
      }

      const chatMessage: ChatMessage = {
        id: `${Date.now()}_${socket.id}`,
        meetingId,
        userId: socket.user?.userId || '',
        userName: socket.user?.name || 'Anonymous',
        message: message.trim(),
        timestamp: new Date().toISOString(),
        isGuest: socket.user?.isGuest || false,
      };

      // Broadcast to all participants in the meeting (including sender)
      io.in(meetingId).emit('new-message', chatMessage);

      console.log(`Chat message in meeting ${meetingId} from ${socket.user?.name}: ${message}`);
    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('chat-error', {
        message: 'Failed to send message',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Typing indicator
  socket.on('typing-start', ({ meetingId }) => {
    try {
      socket.to(meetingId).emit('user-typing', {
        userId: socket.user?.userId,
        userName: socket.user?.name,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error sending typing indicator:', error);
    }
  });

  socket.on('typing-stop', ({ meetingId }) => {
    try {
      socket.to(meetingId).emit('user-stopped-typing', {
        userId: socket.user?.userId,
        userName: socket.user?.name,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error stopping typing indicator:', error);
    }
  });
};
