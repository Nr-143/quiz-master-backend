import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { AnyZodObject, ZodError } from 'zod';
import { AppError } from '../utils/AppError';

export const validate = (schema: AnyZodObject) => (req: Request, res: Response, next: NextFunction) => {
    try {
        schema.parse({
            body: req.body,
            query: req.query,
            params: req.params,
        });
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errorMessage = error.errors.map((err) => `${err.path.join('.')}: ${err.message}`).join(', ');
            next(new AppError(errorMessage, 400));
        } else {
            next(error);
        }
    }
};

export const validateRequest = (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const errorMessage = errors.array().map(err => `${err}: ${err.msg}`).join(', ');
        return next(new AppError(errorMessage, 400));
    }
    next();
};