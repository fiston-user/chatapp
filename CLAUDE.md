# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture

This is a Node.js microservices chat application built with TypeScript and Docker. The system consists of four services:

- **api-gateway** (port 3000) - Express Gateway for enterprise-grade API routing and management
- **auth-service** (port 3001) - Authentication and authorization with JWT tokens
- **chat-service** (port 3002) - Real-time messaging functionality  
- **user-service** (port 3003) - User management and profiles

Each service follows identical patterns: Express.js server, TypeScript configuration, Docker containerization, Prisma ORM for database operations, and hot-reload development setup.

## Infrastructure

The application uses Docker Compose to orchestrate:
- Express Gateway (official Docker image) for API routing and management
- Three Node.js microservices (auth, chat, user services)
- Three separate PostgreSQL 15 databases (ports 5432, 5433, 5434)
- Redis cache (port 6379) for session management and BullMQ message queue
- Custom bridge network for inter-service communication

**Database Configuration:**
- **auth-service** → `chatapp_auth` database (port 5432)
- **user-service** → `chatapp_users` database (port 5433)  
- **chat-service** → `chatapp_chats` database (port 5434)
- Database credentials: `chatapp/chatapp_password` for all databases

## Development Commands

### Start entire application
```bash
docker-compose up --build
```

### Individual service development (with hot reload)
```bash
# Navigate to any service directory first
cd api-gateway   # or auth-service, chat-service, user-service
npm run dev
```

### Build and start individual services
```bash
cd <service-directory>
npm run build    # Compile TypeScript
npm start        # Run compiled JS
```

### Test health endpoints
```bash
# Through Express Gateway (recommended)
curl http://localhost:3000/auth/health  # auth-service via gateway
curl http://localhost:3000/users/health # user-service via gateway
curl http://localhost:3000/chats/health # chat-service via gateway

# Direct service access
curl http://localhost:3001/health  # auth-service direct
curl http://localhost:3002/health  # chat-service direct
curl http://localhost:3003/health  # user-service direct
```

### Test authentication endpoints
```bash
# User registration
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123", "name": "User Name"}'

# User login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}'

# Token verification
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:3000/auth/verify
```

## Service Structure

All services share identical structure and configuration:

**Package.json scripts:**
- `dev` - Hot reload development with ts-node-dev
- `build` - TypeScript compilation
- `start` - Run compiled JavaScript

**Dependencies:** Express 5.1.0, TypeScript 5.8.3, Prisma 6.11.1, dotenv, ts-node-dev, BullMQ, ioredis, Zod

**Auth Service additional dependencies:** bcryptjs, jsonwebtoken (for JWT token management)

**Message Queue dependencies:** BullMQ (Redis-based queue), ioredis (Redis client)

**Validation dependencies:** Zod (TypeScript-first schema validation)

**API Gateway:** Express Gateway (official Docker image) with YAML configuration

**TypeScript config:** ES2016 target, CommonJS modules, strict mode, `src/` input, `dist/` output

**Docker:** Multi-stage builds using node:18-alpine base image

## Inter-Service Communication

**Client → Express Gateway:** All client requests go through Express Gateway on port 3000
- `/auth/*` routes to auth-service:3001
- `/users/*` routes to user-service:3003  
- `/chats/*` routes to chat-service:3002

**Express Gateway Features:**
- CORS handling with configurable origins and headers
- Request/response transformation and routing
- Redis integration for session management
- YAML-based configuration (`gateway.config.yml`, `system.config.yml`)
- Built-in policies for rate limiting, authentication, and proxying

**Service-to-Service:** Services communicate using Docker service names (e.g., `http://auth-service:3001`). For local development outside Docker, use localhost with respective ports.

**Message Queue Communication:** Services use Redis-based BullMQ for asynchronous inter-service communication:
- Auth-service publishes `user.created` events when users register
- User-service worker processes events to automatically sync user data
- Automatic retry logic with exponential backoff for failed jobs
- Production-ready with job persistence and monitoring

## Database

**Prisma ORM** is configured separately for each service:

**Auth Service Database (`chatapp_auth` - port 5432):**
- **Users:** id, email, password, name, avatar, timestamps

**User Service Database (`chatapp_users` - port 5433):**
- **Users:** id, email, name, avatar, timestamps (no password - handled by auth)

**Chat Service Database (`chatapp_chats` - port 5434):**
- **Chats:** id, name, type (private/group), timestamps
- **Messages:** id, content, userId, chatId, timestamps  
- **ChatUsers:** Junction table for user-chat relationships

Each service owns its data domain and maintains referential integrity within its boundaries. Cross-service data access requires API calls between services.

## Implementation Status - PRODUCTION READY ✅

**Core Infrastructure:**
- ✅ Express Gateway with enterprise-grade API routing and management
- ✅ Docker containerization with multi-stage builds
- ✅ Prisma ORM integration with service-specific schemas
- ✅ Database-per-service architecture (3 separate PostgreSQL databases)
- ✅ Redis integration for session management and message queue
- ✅ BullMQ message queue for inter-service communication
- ✅ Health check endpoints for monitoring

**Authentication & Authorization:**
- ✅ User registration and login with JWT tokens
- ✅ JWT middleware for cross-service authentication
- ✅ Password hashing with bcryptjs
- ✅ Token verification and secure endpoints
- ✅ Automatic user synchronization between services

**User Management:**
- ✅ User profile management (get/update profile)
- ✅ User search functionality
- ✅ Cross-service user data consistency
- ✅ Profile validation and error handling

**Chat System:**
- ✅ Create and manage chat rooms (private/group)
- ✅ Send and receive messages
- ✅ Add/remove users from chats
- ✅ Message history with pagination
- ✅ User membership validation and access control

**Production Features:**
- ✅ Comprehensive input validation with Zod schemas
- ✅ Centralized error handling across all services
- ✅ Async error handling with proper HTTP status codes
- ✅ Message queue reliability with retry logic
- ✅ Database transaction handling
- ✅ Graceful shutdown handling

**API Endpoints Available:**
- `POST /auth/register` - User registration
- `POST /auth/login` - User authentication
- `GET /auth/verify` - Token verification
- `GET /users/profile` - Get user profile
- `PUT /users/profile` - Update user profile
- `GET /users/search/:query` - Search users
- `GET /users/:userId` - Get user by ID
- `POST /chats/rooms` - Create chat room
- `GET /chats/rooms` - Get user's chats
- `GET /chats/rooms/:chatId` - Get chat details
- `POST /chats/rooms/:chatId/messages` - Send message
- `GET /chats/rooms/:chatId/messages` - Get message history
- `POST /chats/rooms/:chatId/users` - Add user to chat
- `DELETE /chats/rooms/:chatId/leave` - Leave chat

**Ready for Production Deployment**

**Future Enhancements (Optional):**
- Real-time features (WebSocket/Socket.io for live messaging)
- API documentation (OpenAPI/Swagger)
- Rate limiting and advanced security features
- Monitoring and observability (metrics, tracing)
- File upload and media sharing