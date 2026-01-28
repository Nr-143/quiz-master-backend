import jwt from 'jsonwebtoken';
import { config } from '../config/env.config';

export const signAccessToken = (userId: string): string => {
    return jwt.sign({ id: userId }, config.jwtSecret, {
        expiresIn: '15m', // Access token expires quickly
    });
};

export const signRefreshToken = (userId: string): string => {
    return jwt.sign({ id: userId }, config.jwtRefreshSecret, {
        expiresIn: '7d', // Refresh token lasts longer
    });
};

export const verifyAccessToken = (token: string): any => {
    return jwt.verify(token, config.jwtSecret);
};

export const verifyRefreshToken = (token: string): any => {
    return jwt.verify(token, config.jwtRefreshSecret);
};
