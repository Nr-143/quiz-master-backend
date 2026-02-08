import { Question } from '../models/question.model';
import { UserQuestion } from '../models/user-question.model';
import mongoose from 'mongoose';

export class QuestionService {
    /**
     * Get predefined questions with optional filtering
     */
    async getPredefinedQuestions(filter: any = {}, page: number = 1, limit: number = 20) {
        const skip = (page - 1) * limit;
        const query = { ...filter, isSystemOwned: true };

        const [questions, total] = await Promise.all([
            Question.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Question.countDocuments(query)
        ]);

        return { questions, total, page, totalPages: Math.ceil(total / limit) };
    }

    /**
     * Get user's own questions
     */
    async getUserQuestions(userId: string, filter: any = {}, page: number = 1, limit: number = 20) {
        const skip = (page - 1) * limit;
        const query = { ...filter, userId };

        const [questions, total] = await Promise.all([
            UserQuestion.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            UserQuestion.countDocuments(query)
        ]);

        return { questions, total, page, totalPages: Math.ceil(total / limit) };
    }

    /**
     * Copy a predefined question to the user's personal question bank.
     * This creates a completely independent copy.
     */
    async copyQuestionToUser(userId: string, predefinedQuestionId: string) {
        const predefinedQuestion = await Question.findById(predefinedQuestionId);
        if (!predefinedQuestion) {
            throw new Error('Predefined question not found');
        }

        // Create a new UserQuestion instance
        // Copying data locally ensures independence
        const userQuestionData = {
            userId: userId,
            categoryId: predefinedQuestion.category,
            question: predefinedQuestion.text,
            options: predefinedQuestion.options.map(opt => ({
                id: opt.id,
                text: opt.text
            })),
            correctOptionId: predefinedQuestion.correctOptionId,
            explanation: predefinedQuestion.explanation,
            difficulty: predefinedQuestion.difficulty,
            tags: predefinedQuestion.tags,
            isFromPredefined: true,
            originalQuestionId: predefinedQuestion._id, // Audit trail
        };

        const newUserQuestion = await UserQuestion.create(userQuestionData);
        return newUserQuestion;
    }

    /**
     * Create a new user-owned question (scratch)
     */
    async createUserQuestion(userId: string, data: any) {
        const questionData = {
            ...data,
            userId: userId,
            isFromPredefined: false
        };
        return await UserQuestion.create(questionData);
    }
}

export const questionService = new QuestionService();
