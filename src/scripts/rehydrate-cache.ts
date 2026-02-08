
import mongoose from 'mongoose';
import redisClient from '../config/redis.config';
import { Category } from '../models/category.model';
import { Quiz } from '../models/quiz.model';
import { Question } from '../models/question.model';
import dotenv from 'dotenv';

dotenv.config();

const rehydrateCache = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI as string);
        console.log('Connected to MongoDB');

        if (!redisClient.isOpen) {
            await redisClient.connect();
        }
        console.log('Connected to Redis');

        // 1. Clear existing quiz/category keys 
        // Careful not to clear session data if we want to preserve it, 
        // but user said "On Server Restart: Redis cache must be cleared"
        // We can iterate or flushdb. Safe approach is strict keys.
        const keys = await redisClient.keys('quiz:*');
        if (keys.length > 0) {
            await redisClient.del(keys);
            console.log(`Cleared ${keys.length} quiz keys`);
        }
        await redisClient.del('categories:all');
        console.log('Cleared categories cache');

        // 2. Cache Categories
        const categories = await Category.find({ isActive: true }).select('-_id -__v').lean();
        if (categories.length > 0) {
            await redisClient.setEx('categories:all', 3600, JSON.stringify(categories));
            console.log(`Cached ${categories.length} categories`);
        }

        // 3. Cache Active Quizzes
        const quizzes = await Quiz.find({ isActive: true });
        console.log(`Found ${quizzes.length} active quizzes to cache`);

        for (const quizDoc of quizzes) {
            // We need to resolve questions for the quiz
            // Logic duplicated from QuizService to ensure consistency (or we could import service)
            // Importing service might be better but requires instantiation and mocking? 
            // Let's keep it simple and standalone.

            const questionIds = quizDoc.questions.map(q => q.questionId);
            const questionDocs = await Question.find({ _id: { $in: questionIds } }).lean();

            const mappedQuestions = quizDoc.questions.sort((a, b) => a.order - b.order).map(qItem => {
                const qDoc = questionDocs.find(q => q._id.toString() === qItem.questionId);
                if (!qDoc) return null;
                return {
                    id: qDoc._id.toString(),
                    question: qDoc.text,
                    options: qDoc.options,
                    correctOptionId: qDoc.correctOptionId,
                    explanation: qDoc.explanation,
                    hint: qDoc.explanation,
                    difficulty: qDoc.difficulty,
                    tags: qDoc.tags
                };
            }).filter(q => q !== null);

            const cachedQuiz = {
                category: quizDoc.categoryId, // Matching Service logic (using categoryId or Name? Service used Category Name from Doc, but fallback to ID)
                // Wait, Service used `categoryDoc.name`. Using ID is safer if name changes? 
                // The frontend likely expects `category` field to match what it requested or display name?
                // Existing interface says `category: string`.
                // Let's fetch category for name to be consistent.

                // Optimization: we already fetched all categories.
                category: categories.find(c => c.categoryId === quizDoc.categoryId)?.name || quizDoc.categoryId,
                level: quizDoc.difficulty,
                questions: mappedQuestions
            };

            const redisKey = `quiz:${quizDoc.categoryId.toLowerCase()}`;
            await redisClient.setEx(redisKey, 3600, JSON.stringify(cachedQuiz));
            console.log(`Cached quiz: ${redisKey}`);
        }

        console.log('Rehydration complete');
        process.exit(0);

    } catch (error) {
        console.error('Rehydration failed:', error);
        process.exit(1);
    }
};

rehydrateCache();
