import { Score } from '../models/score.model';

export class ScoreService {
    async getLeaderboard() {
        const { User } = await import('../models/user.model');
        return User.find({ xp: { $gt: 0 } }) // Only users with XP > 0
            .sort({ xp: -1 })
            .limit(20)
            .select('username xp level stats.streak avatar'); // Select necessary fields
    }

    async getUserStats(userId: string) {
        const scores = await Score.find({ user: userId });
        const totalQuizzes = scores.length;
        const totalScore = scores.reduce((acc, curr) => acc + curr.score, 0);
        const averageScore = totalQuizzes > 0 ? (totalScore / totalQuizzes).toFixed(2) : 0;

        return {
            totalQuizzes,
            totalScore,
            averageScore,
            history: scores
        };
    }
}
