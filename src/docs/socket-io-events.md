# Socket.IO Events Documentation

## Connection

### Authentication
Socket.IO connections require JWT authentication. Include the token in the connection handshake:

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000', {
  auth: {
    token: 'your-jwt-token',
    name: 'User Name',
    email: 'user@example.com'
  }
});
```

### Connection Events

#### `connected` (Server → Client)
Emitted when a client successfully connects.

**Payload:**
```javascript
{
  socketId: string;
  userId: string;
  name: string;
  timestamp: string; // ISO 8601
}
```

#### `disconnect` (Client → Server)
Automatically emitted when client disconnects.

---

## Meeting Events

### Join & Leave

#### `join-meeting` (Client → Server)
Join a meeting room.

**Payload:**
```javascript
meetingId: string
```

**Response Events:**
- `joined-meeting` - Confirmation of successful join
- `current-participants` - List of existing participants
- `meeting-error` - Error occurred

#### `joined-meeting` (Server → Client)
Confirmation that you joined the meeting.

**Payload:**
```javascript
{
  meetingId: string;
  success: boolean;
  timestamp: string;
}
```

#### `current-participants` (Server → Client)
List of participants already in the meeting.

**Payload:**
```javascript
{
  participants: Array<{
    userId: string;
    name: string;
    email?: string;
    isGuest: boolean;
    socketId: string;
  }>;
  count: number;
}
```

#### `participant-joined` (Server → Client)
Notifies when a new participant joins the meeting.

**Payload:**
```javascript
{
  userId: string;
  name: string;
  email?: string;
  isGuest: boolean;
  socketId: string;
  timestamp: string;
}
```

#### `leave-meeting` (Client → Server)
Leave a meeting room.

**Payload:**
```javascript
meetingId: string
```

#### `left-meeting` (Server → Client)
Confirmation that you left the meeting.

**Payload:**
```javascript
{
  meetingId: string;
  success: boolean;
  timestamp: string;
}
```

#### `participant-left` (Server → Client)
Notifies when a participant leaves the meeting.

**Payload:**
```javascript
{
  userId: string;
  name: string;
  socketId: string;
  timestamp: string;
}
```

#### `participant-disconnected` (Server → Client)
Notifies when a participant disconnects unexpectedly.

**Payload:**
```javascript
{
  userId: string;
  name: string;
  socketId: string;
  timestamp: string;
}
```

### Participant Status

#### `participant-status-changed` (Client → Server)
Update your camera/microphone status.

**Payload:**
```javascript
{
  meetingId: string;
  status: {
    camera?: boolean;
    microphone?: boolean;
  }
}
```

#### `participant-status-updated` (Server → Client)
Notifies when a participant's status changes.

**Payload:**
```javascript
{
  userId: string;
  name: string;
  socketId: string;
  status: {
    camera: boolean | null;
    microphone: boolean | null;
  };
  timestamp: string;
}
```

---

## Chat Events

### Messages

#### `send-message` (Client → Server)
Send a chat message to the meeting.

**Payload:**
```javascript
{
  meetingId: string;
  message: string; // Max 1000 characters
}
```

**Validation:**
- Message cannot be empty
- Maximum length: 1000 characters

#### `new-message` (Server → Client)
Broadcast to all participants when a message is sent.

**Payload:**
```javascript
{
  id: string;
  meetingId: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: string;
  isGuest: boolean;
}
```

#### `chat-error` (Server → Client)
Error occurred while sending a message.

**Payload:**
```javascript
{
  message: string;
  error?: string;
}
```

### Typing Indicators

#### `typing-start` (Client → Server)
Notify that you started typing.

**Payload:**
```javascript
{
  meetingId: string;
}
```

#### `user-typing` (Server → Client)
Notifies when a user starts typing.

**Payload:**
```javascript
{
  userId: string;
  userName: string;
  timestamp: string;
}
```

#### `typing-stop` (Client → Server)
Notify that you stopped typing.

**Payload:**
```javascript
{
  meetingId: string;
}
```

#### `user-stopped-typing` (Server → Client)
Notifies when a user stops typing.

**Payload:**
```javascript
{
  userId: string;
  userName: string;
  timestamp: string;
}
```

---

## WebRTC Signaling Events

### Peer Connection

#### `webrtc-ready` (Client → Server)
Notify that you're ready to establish WebRTC connections.

**Payload:**
```javascript
{
  meetingId: string;
}
```

#### `peer-ready` (Server → Client)
Notifies when a peer is ready for WebRTC connection.

**Payload:**
```javascript
{
  socketId: string;
  userId: string;
  userName: string;
  timestamp: string;
}
```

### Offers & Answers

#### `webrtc-offer` (Client → Server)
Send WebRTC offer to a specific peer.

**Payload:**
```javascript
{
  meetingId: string;
  targetSocketId: string;
  offer: {
    type: 'offer';
    sdp: string;
  }
}
```

#### `webrtc-offer` (Server → Client)
Receive WebRTC offer from a peer.

**Payload:**
```javascript
{
  from: string; // Socket ID
  fromUserId: string;
  fromUserName: string;
  offer: {
    type: 'offer';
    sdp: string;
  };
  timestamp: string;
}
```

#### `webrtc-answer` (Client → Server)
Send WebRTC answer to a specific peer.

**Payload:**
```javascript
{
  meetingId: string;
  targetSocketId: string;
  answer: {
    type: 'answer';
    sdp: string;
  }
}
```

#### `webrtc-answer` (Server → Client)
Receive WebRTC answer from a peer.

**Payload:**
```javascript
{
  from: string; // Socket ID
  fromUserId: string;
  fromUserName: string;
  answer: {
    type: 'answer';
    sdp: string;
  };
  timestamp: string;
}
```

### ICE Candidates

#### `webrtc-ice-candidate` (Client → Server)
Send ICE candidate to a specific peer.

**Payload:**
```javascript
{
  meetingId: string;
  targetSocketId: string;
  candidate: {
    candidate: string;
    sdpMid: string | null;
    sdpMLineIndex: number | null;
  }
}
```

#### `webrtc-ice-candidate` (Server → Client)
Receive ICE candidate from a peer.

**Payload:**
```javascript
{
  from: string; // Socket ID
  fromUserId: string;
  candidate: {
    candidate: string;
    sdpMid: string | null;
    sdpMLineIndex: number | null;
  };
  timestamp: string;
}
```

### Connection Errors

#### `webrtc-connection-error` (Client → Server)
Report a WebRTC connection error.

**Payload:**
```javascript
{
  meetingId: string;
  targetSocketId: string;
  error: string;
}
```

#### `peer-connection-failed` (Server → Client)
Notifies when a peer connection fails.

**Payload:**
```javascript
{
  from: string; // Socket ID
  fromUserId: string;
  error: string;
  timestamp: string;
}
```

#### `webrtc-error` (Server → Client)
General WebRTC error.

**Payload:**
```javascript
{
  message: string;
  error?: string;
}
```

---

## Notification Events

### Meeting Notifications

#### `meeting-started` (Client → Server)
Notify that the meeting has started.

**Payload:**
```javascript
{
  meetingId: string;
  title: string;
}
```

#### `meeting-ended` (Client → Server)
Notify that the meeting has ended.

**Payload:**
```javascript
{
  meetingId: string;
  reason?: string;
}
```

#### `meeting-ended` (Server → Client)
Broadcast when meeting ends.

**Payload:**
```javascript
{
  meetingId: string;
  endedBy: string;
  endedByName: string;
  reason?: string;
  timestamp: string;
}
```

### Participant Management

#### `kick-participant` (Client → Server)
Remove a participant from the meeting (host only).

**Payload:**
```javascript
{
  meetingId: string;
  targetUserId: string;
  targetSocketId: string;
  reason?: string;
}
```

#### `kicked-from-meeting` (Server → Client)
Notifies a user they've been removed from the meeting.

**Payload:**
```javascript
{
  meetingId: string;
  kickedBy: string;
  kickedByName: string;
  reason: string;
  timestamp: string;
}
```

### General Notifications

#### `send-notification` (Client → Server)
Send a custom notification to all meeting participants.

**Payload:**
```javascript
{
  meetingId: string;
  title: string;
  message: string;
  type?: 'meeting-started' | 'meeting-ended' | 'participant-joined' | 'participant-left' | 'host-changed' | 'kicked' | 'info';
}
```

#### `notification` (Server → Client)
Receive a notification.

**Payload:**
```javascript
{
  id: string;
  type: 'meeting-started' | 'meeting-ended' | 'participant-joined' | 'participant-left' | 'host-changed' | 'kicked' | 'info';
  meetingId: string;
  title: string;
  message: string;
  timestamp: string;
  data?: {
    [key: string]: any;
  }
}
```

#### `notification-error` (Server → Client)
Error occurred while sending notification.

**Payload:**
```javascript
{
  message: string;
  error?: string;
}
```

#### `meeting-error` (Server → Client)
General meeting error.

**Payload:**
```javascript
{
  message: string;
  error?: string;
}
```

---

## Example Usage

### Connecting to Socket.IO

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000', {
  auth: {
    token: localStorage.getItem('token'),
    name: 'John Doe',
    email: 'john@example.com'
  }
});

socket.on('connected', (data) => {
  console.log('Connected:', data);
});
```

### Joining a Meeting

```javascript
// Join meeting
socket.emit('join-meeting', meetingId);

// Listen for confirmation
socket.on('joined-meeting', (data) => {
  console.log('Joined meeting:', data);
});

// Listen for existing participants
socket.on('current-participants', (data) => {
  console.log('Current participants:', data.participants);
});

// Listen for new participants
socket.on('participant-joined', (participant) => {
  console.log('New participant:', participant);
});
```

### Sending Chat Messages

```javascript
// Send message
socket.emit('send-message', {
  meetingId: 'meeting-id',
  message: 'Hello everyone!'
});

// Listen for messages
socket.on('new-message', (message) => {
  console.log('New message:', message);
});
```

### WebRTC Signaling

```javascript
// Notify ready for connections
socket.emit('webrtc-ready', { meetingId });

// Listen for peer ready
socket.on('peer-ready', async (peer) => {
  // Create offer and send to peer
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);

  socket.emit('webrtc-offer', {
    meetingId,
    targetSocketId: peer.socketId,
    offer: peerConnection.localDescription
  });
});

// Handle incoming offer
socket.on('webrtc-offer', async ({ from, offer }) => {
  await peerConnection.setRemoteDescription(offer);
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);

  socket.emit('webrtc-answer', {
    meetingId,
    targetSocketId: from,
    answer: peerConnection.localDescription
  });
});

// Handle ICE candidates
peerConnection.onicecandidate = (event) => {
  if (event.candidate) {
    socket.emit('webrtc-ice-candidate', {
      meetingId,
      targetSocketId: peerSocketId,
      candidate: event.candidate
    });
  }
};

socket.on('webrtc-ice-candidate', async ({ from, candidate }) => {
  await peerConnection.addIceCandidate(candidate);
});
```

### Updating Status

```javascript
// Update camera/mic status
socket.emit('participant-status-changed', {
  meetingId,
  status: {
    camera: true,
    microphone: false
  }
});

// Listen for status updates
socket.on('participant-status-updated', (data) => {
  console.log('Participant status:', data);
});
```

---

## Error Handling

Always implement error handlers for Socket.IO:

```javascript
socket.on('connect_error', (error) => {
  console.error('Connection error:', error.message);
});

socket.on('meeting-error', (error) => {
  console.error('Meeting error:', error);
});

socket.on('chat-error', (error) => {
  console.error('Chat error:', error);
});

socket.on('webrtc-error', (error) => {
  console.error('WebRTC error:', error);
});

socket.on('notification-error', (error) => {
  console.error('Notification error:', error);
});
```
