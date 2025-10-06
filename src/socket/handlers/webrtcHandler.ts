import { Server } from 'socket.io';
import { AuthenticatedSocket } from '../socket';

export interface WebRTCOffer {
  type: 'offer' | 'answer';
  sdp: string;
}

export interface WebRTCCandidate {
  candidate: string;
  sdpMid: string | null;
  sdpMLineIndex: number | null;
}

export interface WebRTCSignal {
  from: string;
  to: string;
  signal: WebRTCOffer | WebRTCCandidate;
  type: 'offer' | 'answer' | 'ice-candidate';
}

export const handleWebRTCEvents = (io: Server, socket: AuthenticatedSocket) => {
  // Send WebRTC offer
  socket.on('webrtc-offer', ({ meetingId, targetSocketId, offer }) => {
    try {
      if (!targetSocketId || !offer) {
        socket.emit('webrtc-error', {
          message: 'Invalid offer data',
        });
        return;
      }

      // Send offer to the target peer
      io.to(targetSocketId).emit('webrtc-offer', {
        from: socket.id,
        fromUserId: socket.user?.userId,
        fromUserName: socket.user?.name,
        offer,
        timestamp: new Date().toISOString(),
      });

      console.log(`WebRTC offer sent from ${socket.id} to ${targetSocketId} in meeting ${meetingId}`);
    } catch (error) {
      console.error('Error sending WebRTC offer:', error);
      socket.emit('webrtc-error', {
        message: 'Failed to send offer',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Send WebRTC answer
  socket.on('webrtc-answer', ({ meetingId, targetSocketId, answer }) => {
    try {
      if (!targetSocketId || !answer) {
        socket.emit('webrtc-error', {
          message: 'Invalid answer data',
        });
        return;
      }

      // Send answer to the target peer
      io.to(targetSocketId).emit('webrtc-answer', {
        from: socket.id,
        fromUserId: socket.user?.userId,
        fromUserName: socket.user?.name,
        answer,
        timestamp: new Date().toISOString(),
      });

      console.log(`WebRTC answer sent from ${socket.id} to ${targetSocketId} in meeting ${meetingId}`);
    } catch (error) {
      console.error('Error sending WebRTC answer:', error);
      socket.emit('webrtc-error', {
        message: 'Failed to send answer',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Send ICE candidate
  socket.on('webrtc-ice-candidate', ({ meetingId, targetSocketId, candidate }) => {
    try {
      if (!targetSocketId || !candidate) {
        socket.emit('webrtc-error', {
          message: 'Invalid ICE candidate data',
        });
        return;
      }

      // Send ICE candidate to the target peer
      io.to(targetSocketId).emit('webrtc-ice-candidate', {
        from: socket.id,
        fromUserId: socket.user?.userId,
        candidate,
        timestamp: new Date().toISOString(),
      });

      console.log(`ICE candidate sent from ${socket.id} to ${targetSocketId} in meeting ${meetingId}`);
    } catch (error) {
      console.error('Error sending ICE candidate:', error);
      socket.emit('webrtc-error', {
        message: 'Failed to send ICE candidate',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Notify that user is ready for WebRTC connections
  socket.on('webrtc-ready', ({ meetingId }) => {
    try {
      socket.to(meetingId).emit('peer-ready', {
        socketId: socket.id,
        userId: socket.user?.userId,
        userName: socket.user?.name,
        timestamp: new Date().toISOString(),
      });

      console.log(`User ${socket.user?.userId} is ready for WebRTC in meeting ${meetingId}`);
    } catch (error) {
      console.error('Error broadcasting WebRTC ready:', error);
    }
  });

  // Handle peer connection errors
  socket.on('webrtc-connection-error', ({ meetingId, targetSocketId, error }) => {
    try {
      if (targetSocketId) {
        io.to(targetSocketId).emit('peer-connection-failed', {
          from: socket.id,
          fromUserId: socket.user?.userId,
          error,
          timestamp: new Date().toISOString(),
        });
      }

      console.error(`WebRTC connection error between ${socket.id} and ${targetSocketId}:`, error);
    } catch (err) {
      console.error('Error handling WebRTC connection error:', err);
    }
  });
};
