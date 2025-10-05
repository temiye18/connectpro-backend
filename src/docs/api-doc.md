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
