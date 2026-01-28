import { Request, Response, NextFunction } from 'express';
import { QuizService } from '../services/quiz.service';

const quizService = new QuizService();

export const getCategories = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const categories = await quizService.getAllCategories();
        res.status(200).json({
            success: true,
            data: { categories },
        });
    } catch (error) {
        next(error);
    }
};

export const getQuiz = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const category = req.query.category as string;
        const level = req.query.level as string;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;

        if (!category) {
            return res.status(400).json({ success: false, message: 'Category is required' });
        }

        const quiz = await quizService.getQuizByCategory(category, level, page, limit);
        res.status(200).json({
            success: true,
            data: quiz,
        });
    } catch (error) {
        next(error);
    }
};

// New endpoint to validate individual answers
export const validateAnswer = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { questionId, selectedOption, category } = req.body;
        // @ts-ignore
        const userId = req.user?.id;

        if (!questionId || !selectedOption || !category) {
            return res.status(400).json({
                success: false,
                message: 'Question ID, selected option, and category are required'
            });
        }

        const result = await quizService.validateAnswer(userId, questionId, selectedOption, category);

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

// New endpoint to get quiz progress
export const getQuizProgress = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { category } = req.query;
        // @ts-ignore
        const userId = req.user?.id;

        if (!category || !userId) {
            return res.status(400).json({
                success: false,
                message: 'Category and user authentication required'
            });
        }

        const result = await quizService.getQuizProgress(userId, category as string);

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

// New endpoint to unlock hint
export const unlockHint = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // User rule asks for `quizId`, we use `category` internally. Map them.
        const { questionId, category, quizId } = req.body;
        const targetCategory = category || quizId;

        // @ts-ignore
        const userId = req.user?.id;

        if (!questionId || !targetCategory || !userId) {
            return res.status(400).json({
                success: false,
                message: 'Question ID, quizId (or category), and authentication are required'
            });
        }

        const result = await quizService.unlockHint(userId, targetCategory, questionId);

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

export const submitQuiz = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { category } = req.body;
        // @ts-ignore
        const userId = req.user?.id || 'anonymous';
        const result = await quizService.submitQuiz(userId, category);

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
}
