import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import logger from '../utils/logger';

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
    let statusCode = 500;
    let message = 'Internal Server Error';

    if (err instanceof AppError) {
        statusCode = err.statusCode;
        message = err.message;
    }

    // Handle MongoDB validation errors
    if (err.name === 'ValidationError') {
        statusCode = 400;
        message = 'Validation Error';
    }

    // Handle MongoDB duplicate key errors
    if (err.name === 'MongoServerError' && (err as any).code === 11000) {
        statusCode = 400;
        message = 'Email or username already exists';
    }

    logger.error(`${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);

    res.status(statusCode).json({
        success: false,
        message,
        error: {
            code: statusCode.toString(),
            message,
        },
    });
};
