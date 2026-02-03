import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { config } from './config/env.config';
import { errorHandler } from './middlewares/error.middleware';
import { AppError } from './utils/AppError';

const app = express();

// Security Headers
app.use(helmet());

// CORS
app.use(cors({
    origin: config.corsOrigin,
    credentials: true,
}));

// Rate Limit
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: config.rateLimitMax,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
});
app.use(limiter);

// Logging
if (config.nodeEnv === 'development') {
    app.use(morgan('dev'));
}

// Body Parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({ status: 'success', message: 'Server is healthy' });
});

import authRoutes from './routes/auth.routes';
import quizRoutes from './routes/quiz.routes';
import userRoutes from './routes/user.routes';
import scoreRoutes from './routes/score.routes';
import examRoutes from './routes/exam.routes';
import categoryRoutes from './routes/category.routes';
import questionPreferenceRoutes from './routes/question-preference.routes';

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/quizzes', quizRoutes);
app.use('/api/quiz', quizRoutes); // Alias for strict requirement
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/scores', scoreRoutes);
app.use('/api/v1/exams', examRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/questions', questionPreferenceRoutes);

// 404 Handler
app.use('*', (req: Request, res: Response, next: NextFunction) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global Error Handler
app.use(errorHandler);

export default app;
