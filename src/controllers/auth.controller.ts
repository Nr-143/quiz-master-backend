import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { User } from '../models/user.model';
import { AppError } from '../utils/AppError';

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
                phone: user.phone,
                qualification: user.qualification,
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

export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?._id;
        const { username, phone, qualification } = req.body;
        
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { username, phone, qualification },
            { new: true, runValidators: true }
        );
        
        if (!updatedUser) {
            throw new AppError('User not found', 404);
        }
        
        res.status(200).json({
            success: true,
            data: {
                user: {
                    id: updatedUser._id,
                    email: updatedUser.email,
                    name: updatedUser.username,
                    username: updatedUser.username,
                    phone: updatedUser.phone,
                    qualification: updatedUser.qualification,
                    role: updatedUser.role,
                    xp: updatedUser.xp,
                    credits: updatedUser.credits,
                    level: updatedUser.level,
                    stats: updatedUser.stats,
                    createdAt: (updatedUser as any).createdAt
                }
            },
            message: 'Profile updated successfully'
        });
    } catch (error) {
        next(error);
    }
};
