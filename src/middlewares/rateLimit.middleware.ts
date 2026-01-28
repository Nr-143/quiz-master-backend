import rateLimit from 'express-rate-limit';

export const hintRateLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    message: 'Too many hint requests, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
});
