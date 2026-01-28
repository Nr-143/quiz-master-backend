import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt.utils';
import { AppError } from '../utils/AppError';
import { User } from '../models/user.model';

// Extend Request interface to include user
declare global {
    namespace Express {
        interface Request {
            user?: any;
        }
    }
}

export const protect = async (req: Request, res: Response, next: NextFunction) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return next(new AppError('You are not logged in', 401));
    }

    try {
        const decoded = verifyAccessToken(token);
        const user = await User.findById(decoded.id);

        if (!user) {
            return next(new AppError('The user belonging to this token no longer exists', 401));
        }

        req.user = user;
        next();
    } catch (error) {
        return next(new AppError('Invalid token', 401));
    }
};
