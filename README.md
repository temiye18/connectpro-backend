# ConnectPro Backend

A robust, scalable backend API for ConnectPro video conferencing platform built with Node.js, Express 5, TypeScript, and MongoDB.

## 🚀 Features

- **User Authentication**: JWT-based authentication with bcrypt password hashing
- **RESTful API**: Well-structured REST API endpoints
- **Real-time Communication**: Socket.IO integration for live features
- **Database**: MongoDB with Mongoose ODM
- **TypeScript**: Fully typed codebase for enhanced developer experience
- **Input Validation**: Express-validator for request validation
- **Security**: CORS, password hashing, and JWT token management
- **Error Handling**: Centralized error handling middleware
- **API Documentation**: Comprehensive API documentation

## 🛠️ Tech Stack

- **Runtime**: [Node.js](https://nodejs.org/)
- **Framework**: [Express 5.1.0](https://expressjs.com/)
- **Language**: [TypeScript 5.6.3](https://www.typescriptlang.org/)
- **Database**: [MongoDB](https://www.mongodb.com/) with [Mongoose 8.17.1](https://mongoosejs.com/)
- **Authentication**: [JWT](https://jwt.io/) + [bcrypt 6.0.0](https://github.com/kelektiv/node.bcrypt.js)
- **Real-time**: [Socket.IO 4.8.1](https://socket.io/)
- **Validation**: [express-validator 7.2.1](https://express-validator.github.io/)
- **Testing**: [Jest 30.2.0](https://jestjs.io/) + [Supertest 7.1.4](https://github.com/ladjs/supertest)

## 📋 Prerequisites

- **Node.js**: v18.x or higher
- **npm**: v9.x or higher
- **MongoDB**: v5.x or higher (local or MongoDB Atlas)

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd connectpro-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**

   Create a `.env` file in the root directory:
   ```env
   # Server
   PORT=5000

   # Database
   MONGO_URI=mongodb://localhost:27017/connectpro
   # Or use MongoDB Atlas:
   # MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/connectpro

   # JWT
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

   # CORS Origins (comma-separated)
   ALLOWED_ORIGINS=http://localhost:3000
   ```

4. **Build the project**
   ```bash
   npm run build
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Server is running!**

   API available at [http://localhost:5000](http://localhost:5000)

## 📁 Project Structure

```
connectpro-backend/
├── src/
│   ├── config/              # Configuration files
│   │   └── database.ts      # MongoDB connection
│   ├── controllers/         # Request handlers
│   │   └── auth.controller.ts
│   ├── middleware/          # Express middlewares
│   │   ├── auth.middleware.ts
│   │   └── validate.middleware.ts
│   ├── models/              # Mongoose models
│   │   └── user.model.ts
│   ├── routes/              # API routes
│   │   └── auth.routes.ts
│   ├── docs/                # API documentation
│   │   └── api-doc.md
│   └── server.ts            # Application entry point
├── dist/                    # Compiled JavaScript (generated)
├── .env                     # Environment variables (create this)
├── package.json
└── tsconfig.json
```

## 🎯 Available Scripts

```bash
# Development
npm run dev          # Start development server with nodemon

# Build
npm run build        # Compile TypeScript to JavaScript
npm run start        # Start production server

# Testing
npm run test         # Run tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage

# Utilities
npm run copy-templates # Copy template files to dist
```

## 🌐 Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | Server port | `7777` | No |
| `MONGO_URI` | MongoDB connection string | - | Yes |
| `JWT_SECRET` | Secret key for JWT signing | - | Yes |
| `ALLOWED_ORIGINS` | CORS allowed origins | - | No |

## 📚 API Documentation

Full API documentation is available at [`src/docs/api-doc.md`](./src/docs/api-doc.md)

### Quick Reference

#### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | Login user | No |
| GET | `/api/auth/me` | Get current user | Yes |
| POST | `/api/auth/logout` | Logout user | Yes |

### Example: Register User

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123",
    "name": "John Doe"
  }'
```

### Example: Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123"
  }'
```

### Example: Protected Route

```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer <your_jwt_token>"
```

## 🔐 Authentication & Security

### Password Security
- Passwords hashed using bcrypt with 10 salt rounds
- Minimum 8 characters
- Must contain uppercase, lowercase, and number

### JWT Tokens
- Tokens expire after 7 days
- Signed with HS256 algorithm
- Includes user ID in payload

### CORS Configuration
- Configurable allowed origins
- Supports credentials
- Preflight request handling

## 🗄️ Database Schema

### User Model

```typescript
{
  email: string;        // Unique, lowercase, validated
  password: string;     // Hashed with bcrypt
  name: string;        // 2-50 characters
  avatar?: string;     // Optional profile picture URL
  createdAt: Date;     // Auto-generated
  updatedAt: Date;     // Auto-generated
}
```

## 🧪 Testing

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

Testing stack:
- Jest for test runner
- Supertest for API testing
- ts-jest for TypeScript support

## 🚀 Deployment

### Build for Production

```bash
npm run build
NODE_ENV=production npm run start
```

### Deploy to Common Platforms

#### Render / Railway
1. Connect your repository
2. Set build command: `npm run build`
3. Set start command: `npm run start`
4. Add environment variables

#### Heroku
```bash
heroku create connectpro-api
heroku config:set MONGO_URI=<your-mongodb-uri>
heroku config:set JWT_SECRET=<your-jwt-secret>
git push heroku main
```

#### Docker (Optional)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 5000
CMD ["npm", "start"]
```

## 📊 Project Conventions

### Naming Conventions
- **Models**: `*.model.ts` (e.g., `user.model.ts`)
- **Controllers**: `*.controller.ts` (e.g., `auth.controller.ts`)
- **Routes**: `*.routes.ts` (e.g., `auth.routes.ts`)
- **Middleware**: `*.middleware.ts` (e.g., `auth.middleware.ts`)

### Code Style
- Use TypeScript strict mode
- No `any` types allowed
- Follow layered architecture: Routes → Controllers → Services → Models
- Async/await for asynchronous operations
- Proper error handling with try-catch blocks

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Follow the naming conventions
4. Write tests for new features
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 🔗 Related Projects

- [ConnectPro Frontend](../connectpro-frontend) - Next.js/React frontend application

## 📧 Support

For support, email support@connectpro.com or open an issue on GitHub.

---

Built with ❤️ using Node.js, Express, and TypeScript
