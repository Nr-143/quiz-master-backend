import { Request, Response, NextFunction } from 'express';
import { ScoreService } from '../services/score.service';

const scoreService = new ScoreService();

export const getLeaderboard = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const users = await scoreService.getLeaderboard();

        // Format for frontend
        const leaderboard = users.map((user: any, index: number) => ({
            rank: index + 1,
            name: user.username,
            score: user.xp,
            level: user.level,
            streak: user.stats?.streak || 0,
            avatar: user.username.substring(0, 2).toUpperCase(),
            // @ts-ignore
            isCurrentUser: req.user?._id.toString() === user._id.toString()
        }));

        res.status(200).json({
            success: true, // Frontend expects 'success'
            data: leaderboard, // Frontend expects array directly or inside data? Checked frontend code: expects array if directly mapped or typically data.data
        });
    } catch (error) {
        next(error);
    }
};

export const getUserStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // req.user is populated by protect middleware
        const stats = await scoreService.getUserStats(req.user.userId);
        res.status(200).json({
            status: 'success',
            data: { stats },
        });
    } catch (error) {
        next(error);
    }
};
