import { Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { handleMeetingEvents } from './handlers/meetingHandler';
import { handleChatEvents } from './handlers/chatHandler';
import { handleWebRTCEvents } from './handlers/webrtcHandler';
import { handleNotificationEvents } from './handlers/notificationHandler';

export interface SocketUser {
  userId: string;
  name: string;
  email?: string;
  isGuest: boolean;
}

export interface AuthenticatedSocket extends Socket {
  user?: SocketUser;
}

export const initializeSocket = (httpServer: HTTPServer): Server => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Authentication middleware
  io.use((socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as {
        userId: string;
        isGuest?: boolean;
      };

      // Attach user info to socket
      socket.user = {
        userId: decoded.userId,
        name: socket.handshake.auth.name || 'User',
        email: socket.handshake.auth.email,
        isGuest: decoded.isGuest || false,
      };

      next();
    } catch (error) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  // Connection handler
  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`User connected: ${socket.user?.userId} (${socket.user?.name})`);

    // Register all event handlers
    handleMeetingEvents(io, socket);
    handleChatEvents(io, socket);
    handleWebRTCEvents(io, socket);
    handleNotificationEvents(io, socket);

    // Send connection confirmation
    socket.emit('connected', {
      socketId: socket.id,
      userId: socket.user?.userId,
      name: socket.user?.name,
      timestamp: new Date().toISOString(),
    });
  });

  return io;
};
