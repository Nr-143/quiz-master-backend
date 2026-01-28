import express from 'express';
import * as quizController from '../controllers/quiz.controller';
import { protect } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { hintRateLimiter } from '../middlewares/rateLimit.middleware';
import { z } from 'zod';

const router = express.Router();

// Optional auth middleware - allows both authenticated and anonymous users
const optionalAuth = async (req: any, res: any, next: any) => {
    try {
        await protect(req, res, next);
    } catch (error) {
        // Continue without authentication
        next();
    }
};

const submitSchema = z.object({
    body: z.object({
        category: z.string(),
        answers: z.array(z.object({
            id: z.string(),
            answer: z.string()
        }))
    })
});

const validateAnswerSchema = z.object({
    body: z.object({
        questionId: z.string(),
        selectedOption: z.string(),
        category: z.string()
    })
});

const unlockHintSchema = z.object({
    body: z.object({
        questionId: z.string(),
        category: z.string().optional(),
        quizId: z.string().optional()
    }).refine(data => data.category || data.quizId, {
        message: "Either category or quizId is required"
    })
});

// Remove auth requirement for fetching quizzes and categories
router.get('/', quizController.getQuiz);
router.get('/categories', quizController.getCategories);
router.get('/progress', optionalAuth, quizController.getQuizProgress);
router.post('/validate-answer', optionalAuth, validate(validateAnswerSchema), quizController.validateAnswer);
router.post('/submit', optionalAuth, validate(submitSchema), quizController.submitQuiz);
router.post('/unlock-hint', protect, hintRateLimiter, validate(unlockHintSchema), quizController.unlockHint);

export default router;
