import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';

const authService = new AuthService();

export const register = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { user, accessToken, refreshToken } = await authService.register(req.body);

        res.status(201).json({
            success: true,
            data: { 
                user: {
                    id: user._id,
                    email: user.email,
                    name: user.username,
                    username: user.username,
                    role: user.role,
                    xp: user.xp,
                    credits: user.credits,
                    level: user.level,
                    stats: user.stats,
                    createdAt: (user as any).createdAt
                }, 
                token: accessToken, 
                refreshToken 
            },
        });
    } catch (error) {
        next(error);
    }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { user, accessToken, refreshToken } = await authService.login(req.body);

        res.status(200).json({
            success: true,
            data: { 
                user: {
                    id: user._id,
                    email: user.email,
                    name: user.username,
                    username: user.username,
                    role: user.role,
                    xp: user.xp,
                    credits: user.credits,
                    level: user.level,
                    stats: user.stats,
                    createdAt: (user as any).createdAt
                }, 
                token: accessToken, 
                refreshToken 
            },
        });
    } catch (error) {
        next(error);
    }
};

export const refresh = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { refreshToken } = req.body;
        const { accessToken } = await authService.refreshToken(refreshToken);

        res.status(200).json({
            success: true,
            data: { accessToken },
        });
    } catch (error) {
        next(error);
    }
};

export const getMe = async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    res.status(200).json({
        success: true,
        data: { 
            user: {
                id: user._id,
                email: user.email,
                name: user.username,
                username: user.username,
                role: user.role,
                xp: user.xp,
                credits: user.credits,
                level: user.level,
                stats: user.stats,
                createdAt: (user as any).createdAt
            }
        },
    });
};
