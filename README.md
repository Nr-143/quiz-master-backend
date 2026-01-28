# Quiz App Backend API

Backend API for Quiz Journey application with secure hint system, JWT authentication, and credit management.

## Features

- ✅ JWT Authentication & Authorization
- ✅ Secure Hint Unlock System (5 credits per hint)
- ✅ Rate Limiting (10 req/min)
- ✅ Credit Management System
- ✅ Quiz Session Tracking
- ✅ Leaderboard & Scoring
- ✅ MongoDB Database
- ✅ Redis Caching
- ✅ TypeScript

## Tech Stack

- Node.js + Express
- TypeScript
- MongoDB + Mongoose
- Redis
- JWT
- Zod (Validation)
- Winston (Logging)

## Installation

```bash
npm install
```

## Environment Variables

Create `.env` file:

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/quiz
JWT_SECRET=your_secret_key
REDIS_URL=redis://localhost:6379
NODE_ENV=development
```

## Run Development

```bash
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Quiz
- `GET /api/quizzes` - Get all quizzes
- `GET /api/quizzes/:id` - Get quiz by ID
- `POST /api/quizzes/unlock-hint` - Unlock hint (requires auth)

### User
- `GET /api/users/profile` - Get user profile
- `GET /api/users/credits` - Get user credits

### Scores
- `POST /api/scores` - Submit score
- `GET /api/scores/leaderboard` - Get leaderboard

## Branch: Nr-143

This branch contains the complete implementation of:
- Mobile-first responsive design support
- Secure hint unlock system
- Credit validation and management
- Rate limiting and security features
