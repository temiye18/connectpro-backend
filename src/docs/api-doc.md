# ConnectPro API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication Endpoints

### 1. Register User
Create a new user account.

**Endpoint:** `POST /auth/register`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "name": "John Doe"
}
```

**Validation Rules:**
- `email`: Must be a valid email address
- `password`: Minimum 8 characters, must contain at least one uppercase letter, one lowercase letter, and one number
- `name`: 2-50 characters

**Success Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "6542abc123def456789",
      "email": "user@example.com",
      "name": "John Doe",
      "avatar": null
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "User with this email already exists"
}
```

**Error Response (400 - Validation):**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "password",
      "message": "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    }
  ]
}
```

---

### 2. Login User
Authenticate an existing user.

**Endpoint:** `POST /auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Validation Rules:**
- `email`: Must be a valid email address
- `password`: Required

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "6542abc123def456789",
      "email": "user@example.com",
      "name": "John Doe",
      "avatar": null
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Response (401):**
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

---

### 3. Get Current User
Get the currently authenticated user's information.

**Endpoint:** `GET /auth/me`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "6542abc123def456789",
      "email": "user@example.com",
      "name": "John Doe",
      "avatar": null,
      "createdAt": "2024-01-20T10:30:00.000Z",
      "updatedAt": "2024-01-20T10:30:00.000Z"
    }
  }
}
```

**Error Response (401):**
```json
{
  "success": false,
  "message": "Access denied. No token provided."
}
```

**Error Response (401 - Invalid Token):**
```json
{
  "success": false,
  "message": "Invalid or expired token."
}
```

---

### 4. Logout User
Logout the currently authenticated user.

**Endpoint:** `POST /auth/logout`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

**Note:** JWT tokens are stateless. Logout is handled client-side by removing the token. This endpoint is provided for consistency and potential future use (e.g., token blacklisting).

---

### 5. Create Guest Session
Create a temporary guest user session without registration.

**Endpoint:** `POST /auth/guest`

**Request Body:**
```json
{
  "name": "Guest User"
}
```

**Validation Rules:**
- `name`: Required, 2-50 characters

**Success Response (201):**
```json
{
  "success": true,
  "message": "Guest session created successfully",
  "data": {
    "user": {
      "id": "6542abc123def456789",
      "name": "Guest User",
      "isGuest": true
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Response (400 - Validation):**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "name",
      "message": "Name must be between 2 and 50 characters"
    }
  ]
}
```

**Error Response (500):**
```json
{
  "success": false,
  "message": "Server error"
}
```

**Notes:**
- Guest tokens expire after 24 hours (vs 7 days for regular users)
- Guest users can create and join meetings
- Guest users have a unique auto-generated email internally
- Guest sessions work with all meeting endpoints

---

## Meeting Endpoints

### 1. Create Meeting (Instant Meeting)
Create a new instant meeting.

**Endpoint:** `POST /meetings`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "title": "Project Discussion",
  "settings": {
    "camera": true,
    "microphone": true
  }
}
```

**Validation Rules:**
- `title`: Optional, 1-100 characters
- `settings`: Optional object
- `settings.camera`: Optional boolean (default: true)
- `settings.microphone`: Optional boolean (default: true)

**Success Response (201):**
```json
{
  "meetingId": "6542abc123def456789",
  "meetingLink": "http://localhost:3000/meeting/6542abc123def456789",
  "meetingCode": "A1B2C3D4",
  "createdAt": "2024-01-20T10:30:00.000Z"
}
```

**Error Response (401):**
```json
{
  "message": "User not authenticated"
}
```

**Error Response (500):**
```json
{
  "message": "Server error"
}
```

---

### 2. Get Recent Meetings
Fetch user's recent meetings for dashboard display.

**Endpoint:** `GET /meetings/recent`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `limit` (optional): Number of meetings to return (1-50, default: 10)

**Example Request:**
```
GET /api/meetings/recent?limit=5
```

**Validation Rules:**
- `limit`: Optional integer between 1 and 50

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "meetings": [
      {
        "_id": "6542abc123def456789",
        "title": "Team Standup",
        "createdAt": "2024-01-20T10:30:00.000Z",
        "meetingCode": "A1B2C3D4",
        "status": "scheduled",
        "participants": []
      },
      {
        "_id": "6542xyz987fed654321",
        "title": "Project Review",
        "createdAt": "2024-01-19T14:00:00.000Z",
        "meetingCode": "B2C3D4E5",
        "status": "ended",
        "participants": [
          {
            "userId": "6542abc123def456789",
            "name": "John Doe",
            "joinedAt": "2024-01-19T14:00:00.000Z",
            "leftAt": "2024-01-19T15:00:00.000Z"
          }
        ]
      }
    ],
    "total": 2
  }
}
```

**Error Response (401):**
```json
{
  "message": "User not authenticated"
}
```

**Error Response (400 - Invalid Limit):**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "limit",
      "message": "Limit must be between 1 and 50"
    }
  ]
}
```

**Error Response (500):**
```json
{
  "message": "Server error"
}
```

---

### 3. Join Meeting
Join an existing meeting by meeting code.

**Endpoint:** `POST /meetings/join`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "meetingCode": "A1B2C3D4",
  "name": "John Doe",
  "settings": {
    "camera": true,
    "microphone": true
  }
}
```

**Validation Rules:**
- `meetingCode`: Required string
- `name`: Optional, 2-50 characters
- `settings`: Optional object
- `settings.camera`: Optional boolean
- `settings.microphone`: Optional boolean

**Success Response (200):**
```json
{
  "meetingId": "6542abc123def456789",
  "roomToken": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6",
  "participants": [
    {
      "userId": "6542abc123def456789",
      "name": "John Doe",
      "joinedAt": "2024-01-20T10:30:00.000Z"
    },
    {
      "userId": "6542xyz987fed654321",
      "name": "Jane Smith",
      "joinedAt": "2024-01-20T10:31:00.000Z"
    }
  ]
}
```

**Error Response (401):**
```json
{
  "message": "User not authenticated"
}
```

**Error Response (404):**
```json
{
  "message": "Meeting not found"
}
```

**Error Response (400 - Meeting Ended):**
```json
{
  "message": "Meeting has ended"
}
```

**Error Response (400 - Validation):**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "meetingCode",
      "message": "Meeting code is required"
    }
  ]
}
```

**Error Response (500):**
```json
{
  "message": "Server error"
}
```

---

### 4. Start Existing Meeting
Start a scheduled meeting by meeting ID. Only the host can start the meeting.

**Endpoint:** `POST /meetings/:id/start`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**URL Parameters:**
- `id`: Meeting ID (MongoDB ObjectId)

**Success Response (200):**
```json
{
  "meetingId": "6542abc123def456789",
  "meetingLink": "http://localhost:3000/meeting/6542abc123def456789",
  "status": "active"
}
```

**Error Response (400 - Invalid ID):**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "id",
      "message": "Invalid meeting ID"
    }
  ]
}
```

**Error Response (401):**
```json
{
  "message": "User not authenticated"
}
```

**Error Response (403):**
```json
{
  "message": "Only the host can start the meeting"
}
```

**Error Response (404):**
```json
{
  "message": "Meeting not found"
}
```

**Error Response (400 - Meeting Ended):**
```json
{
  "message": "Meeting has already ended"
}
```

**Error Response (500):**
```json
{
  "message": "Server error"
}
```

---

### 5. Get Meeting Details
Retrieve detailed information about a meeting by ID or meeting code.

**Endpoint:** `GET /meetings/:id`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**URL Parameters:**
- `id`: Meeting ID (MongoDB ObjectId) or Meeting Code (e.g., "A1B2C3D4")

**Success Response (200):**
```json
{
  "meeting": {
    "_id": "6542abc123def456789",
    "title": "Team Standup",
    "code": "A1B2C3D4",
    "link": "http://localhost:3000/meeting/6542abc123def456789",
    "host": {
      "_id": "6542xyz987fed654321",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "participants": [
      {
        "userId": "6542def456ghi789012",
        "name": "Jane Smith",
        "joinedAt": "2024-01-20T10:30:00.000Z",
        "leftAt": null
      }
    ],
    "status": "active",
    "createdAt": "2024-01-20T10:00:00.000Z",
    "startedAt": "2024-01-20T10:30:00.000Z",
    "endedAt": null
  }
}
```

**Error Response (401):**
```json
{
  "message": "User not authenticated"
}
```

**Error Response (404):**
```json
{
  "message": "Meeting not found"
}
```

**Error Response (500):**
```json
{
  "message": "Server error"
}
```

**Notes:**
- This endpoint accepts both MongoDB ObjectId and meeting code in the `:id` parameter
- Any authenticated user can view meeting details (not restricted to host or participants)
- The `startedAt` and `endedAt` fields are only included if they have values

---

### 6. Leave Meeting
Leave an active meeting as a participant.

**Endpoint:** `POST /meetings/:id/leave`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**URL Parameters:**
- `id`: Meeting ID (MongoDB ObjectId)

**Success Response (200):**
```json
{
  "success": true,
  "message": "Left meeting successfully"
}
```

**Error Response (400 - Not a Participant):**
```json
{
  "message": "You are not a participant in this meeting"
}
```

**Error Response (400 - Invalid ID):**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "id",
      "message": "Invalid meeting ID"
    }
  ]
}
```

**Error Response (401):**
```json
{
  "message": "User not authenticated"
}
```

**Error Response (404):**
```json
{
  "message": "Meeting not found"
}
```

**Error Response (500):**
```json
{
  "message": "Server error"
}
```

**Notes:**
- Updates the participant's `leftAt` timestamp
- Does not remove the participant from the participants list
- User must have previously joined the meeting

---

### 7. End Meeting
End a meeting (host only).

**Endpoint:** `POST /meetings/:id/end`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**URL Parameters:**
- `id`: Meeting ID (MongoDB ObjectId)

**Success Response (200):**
```json
{
  "success": true,
  "message": "Meeting ended successfully"
}
```

**Error Response (400 - Already Ended):**
```json
{
  "message": "Meeting has already ended"
}
```

**Error Response (400 - Invalid ID):**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "id",
      "message": "Invalid meeting ID"
    }
  ]
}
```

**Error Response (401):**
```json
{
  "message": "User not authenticated"
}
```

**Error Response (403):**
```json
{
  "message": "Only the host can end the meeting"
}
```

**Error Response (404):**
```json
{
  "message": "Meeting not found"
}
```

**Error Response (500):**
```json
{
  "message": "Server error"
}
```

**Notes:**
- Only the meeting host can end the meeting
- Sets meeting status to `ended`
- Sets the `endedAt` timestamp
- Can end meetings in `scheduled` or `active` status

---

## Error Responses

### Common Error Codes

**400 Bad Request**
- Invalid input data
- Validation errors

**401 Unauthorized**
- Missing or invalid authentication token
- Invalid credentials

**404 Not Found**
- Route does not exist

**500 Internal Server Error**
- Server-side error

### Standard Error Response Format
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message (in development only)"
}
```

---

## Authentication

Most endpoints require authentication using JWT tokens. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

Tokens expire after 7 days. After expiration, users must login again to obtain a new token.
