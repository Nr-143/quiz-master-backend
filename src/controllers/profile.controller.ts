import { Request, Response, NextFunction } from 'express';
import { User } from '../models/user.model';
import { QuizSession } from '../models/quiz-session.model';
import { Quiz } from '../models/quiz.model';
import { Category } from '../models/category.model';

export const getProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user; // Populated by protect middleware

    // Enrich stats.categoryProgress with category names
    let enrichedCategoryProgress: any = {};
    if (user.stats && user.stats.categoryProgress) {
      // user.stats.categoryProgress might be a Map or POJO depending on mongoose state
      const progressMap = user.stats.categoryProgress instanceof Map
        ? user.stats.categoryProgress
        : new Map(Object.entries(user.stats.categoryProgress || {}));

      const categoryIds = Array.from(progressMap.keys());

      let categoryMap = new Map();
      if (categoryIds.length > 0) {
        const categories = await Category.find({ categoryId: { $in: categoryIds } }).lean();
        categoryMap = new Map(categories.map((c: any) => [c.categoryId, c.name]));
      }

      progressMap.forEach((value: any, key: string) => {
        enrichedCategoryProgress[key] = {
          ...value,
          name: categoryMap.get(key) || 'Unknown Category',
          categoryId: key
        };
      });
    }

    const profile = {
      userId: user.userId, // uuid
      username: user.username,
      email: user.email,
      xp: user.xp,
      credits: user.credits,
      level: user.level,
      stats: {
        ...user.stats,
        categoryProgress: enrichedCategoryProgress
      }
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

    // Fetch Quiz details for active sessions to get metadata (difficulty/level)
    const quizIds = activeSessions.map(s => s.quizId);
    const quizzes = await Quiz.find({ quizId: { $in: quizIds } }).lean();

    const activeQuizzes = activeSessions.map(session => {
      const quiz = quizzes.find(q => q.quizId === session.quizId);
      return {
        sessionId: session.sessionId,
        category: session.categoryId, // Updated from .category
        level: quiz?.difficulty || 'unknown', // Updated from .level
        startedAt: session.startedAt,
        answeredQuestions: session.answeredQuestions.length,
        totalQuestions: session.totalQuestions,
        status: session.status
      };
    });

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