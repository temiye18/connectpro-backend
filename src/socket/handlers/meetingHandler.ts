import { Server } from 'socket.io';
import { AuthenticatedSocket } from '../socket';

export const handleMeetingEvents = (io: Server, socket: AuthenticatedSocket) => {
  // Join meeting room
  socket.on('join-meeting', async (meetingId: string) => {
    try {
      socket.join(meetingId);
      console.log(`User ${socket.user?.userId} joined meeting: ${meetingId}`);

      // Get all sockets in the room
      const socketsInRoom = await io.in(meetingId).fetchSockets();

      // Prepare participant list (excluding the new joiner)
      const participants = socketsInRoom
        .filter((s) => s.id !== socket.id)
        .map((s) => {
          const authenticatedSocket = s as unknown as AuthenticatedSocket;
          return {
            userId: authenticatedSocket.user?.userId,
            name: authenticatedSocket.user?.name,
            email: authenticatedSocket.user?.email,
            isGuest: authenticatedSocket.user?.isGuest,
            socketId: s.id,
          };
        });

      // Send current participants to the new user
      socket.emit('current-participants', {
        participants,
        count: participants.length,
      });

      // Notify others in the room about new participant
      socket.to(meetingId).emit('participant-joined', {
        userId: socket.user?.userId,
        name: socket.user?.name,
        email: socket.user?.email,
        isGuest: socket.user?.isGuest,
        socketId: socket.id,
        timestamp: new Date().toISOString(),
      });

      // Send success confirmation
      socket.emit('joined-meeting', {
        meetingId,
        success: true,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error joining meeting:', error);
      socket.emit('meeting-error', {
        message: 'Failed to join meeting',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Leave meeting room
  socket.on('leave-meeting', (meetingId: string) => {
    try {
      socket.leave(meetingId);
      console.log(`User ${socket.user?.userId} left meeting: ${meetingId}`);

      // Notify others in the room
      socket.to(meetingId).emit('participant-left', {
        userId: socket.user?.userId,
        name: socket.user?.name,
        socketId: socket.id,
        timestamp: new Date().toISOString(),
      });

      // Send success confirmation
      socket.emit('left-meeting', {
        meetingId,
        success: true,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error leaving meeting:', error);
      socket.emit('meeting-error', {
        message: 'Failed to leave meeting',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Participant status updates (camera, microphone)
  socket.on('participant-status-changed', ({ meetingId, status }) => {
    try {
      const { camera, microphone } = status;

      // Broadcast status change to all participants in the meeting
      socket.to(meetingId).emit('participant-status-updated', {
        userId: socket.user?.userId,
        name: socket.user?.name,
        socketId: socket.id,
        status: {
          camera: camera !== undefined ? camera : null,
          microphone: microphone !== undefined ? microphone : null,
        },
        timestamp: new Date().toISOString(),
      });

      console.log(`User ${socket.user?.userId} status changed in meeting ${meetingId}:`, status);
    } catch (error) {
      console.error('Error updating participant status:', error);
      socket.emit('meeting-error', {
        message: 'Failed to update status',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.user?.userId}`);

    // Notify all rooms this user was in
    socket.rooms.forEach((room) => {
      if (room !== socket.id) {
        socket.to(room).emit('participant-disconnected', {
          userId: socket.user?.userId,
          name: socket.user?.name,
          socketId: socket.id,
          timestamp: new Date().toISOString(),
        });
      }
    });
  });
};
