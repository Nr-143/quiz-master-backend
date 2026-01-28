import { Request, Response, NextFunction } from 'express';
import { User } from '../models/user.model';
import { QuizSession } from '../models/quiz-session.model';

export const getProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user; // Populated by protect middleware

    // Map to UserProfile interface expected by frontend
    // We use the User document directly since it's already fetched
    const profile = {
      userId: user.userId, // uuid
      username: user.username,
      email: user.email,
      xp: user.xp,
      credits: user.credits,
      level: user.level,
      stats: user.stats
    };

    res.status(200).json({
      success: true,
      data: profile
    });
  } catch (error) {
    next(error);
  }
};

export const getQuizStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user._id; // Use Mongo ID for querying QuizSession

    // Aggregate stats
    const [totalStarted, totalCompleted, totalAbandoned] = await Promise.all([
      QuizSession.countDocuments({ user: userId }),
      QuizSession.countDocuments({ user: userId, status: 'completed' }),
      QuizSession.countDocuments({ user: userId, status: 'abandoned' })
    ]);

    // Get active quizzes
    const activeSessions = await QuizSession.find({
      user: userId,
      status: 'active'
    })
      .sort({ startedAt: -1 })
      .limit(5); // Limit to recent active quizzes

    const activeQuizzes = activeSessions.map(session => ({
      sessionId: session.sessionId,
      category: session.category,
      level: session.level,
      startedAt: session.startedAt,
      answeredQuestions: session.answeredQuestions.length,
      totalQuestions: session.totalQuestions,
      status: session.status
    }));

    res.status(200).json({
      success: true,
      data: {
        totalStarted,
        totalCompleted,
        totalAbandoned,
        activeQuizzes
      }
    });
  } catch (error) {
    next(error);
  }
};