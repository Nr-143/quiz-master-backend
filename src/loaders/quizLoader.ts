import fs from 'fs';
import path from 'path';
import { IQuiz } from '../models/quiz.interface';
import redisClient from '../config/redis.config';
import logger from '../utils/logger';
import { Category } from '../models/category.model';
import { Question } from '../models/question.model';
import { Quiz } from '../models/quiz.model';
import { randomUUID } from 'crypto';

const QUIZ_DIR = path.join(__dirname, '../../static/quizzes');

const mapDifficulty = (level: string): 'easy' | 'medium' | 'hard' => {
    const l = level.toLowerCase();
    if (l.includes('beginner') || l.includes('easy')) return 'easy';
    if (l.includes('intermediate') || l.includes('medium')) return 'medium';
    if (l.includes('advanced') || l.includes('hard') || l.includes('expert')) return 'hard';
    return 'medium'; // Default
};

export const loadQuizzes = async (): Promise<void> => {
    try {
        if (!fs.existsSync(QUIZ_DIR)) {
            logger.warn(`Quiz directory not found: ${QUIZ_DIR}`);
            return;
        }

        const files = fs.readdirSync(QUIZ_DIR).filter((file) => file.endsWith('.json'));
        logger.info(`Found ${files.length} quiz files to load.`);

        for (const file of files) {
            const filePath = path.join(QUIZ_DIR, file);
            const content = fs.readFileSync(filePath, 'utf-8');
            const quizData: IQuiz = JSON.parse(content);

            if (!quizData.category || !quizData.questions) {
                logger.error(`Invalid quiz format in file: ${file}`);
                continue;
            }

            // 1. Upsert Category
            let category = await Category.findOne({ name: quizData.category });
            if (!category) {
                category = await Category.create({
                    categoryId: randomUUID(),
                    name: quizData.category,
                    icon: 'default-icon', // JSON doesn't have icon
                    description: `${quizData.category} Quizzes`,
                    color: '#4F46E5', // Default Indigo
                    type: 'system',
                    isActive: true,
                    questionCount: quizData.questions.length // Initialize count
                });
                logger.info(`Created Category: ${category.name}`);
            } else {
                // Update question count for existing categories
                category.questionCount = quizData.questions.length;
                await category.save();
            }

            // 2. Process Questions
            const questionRefs = [];
            let order = 1;

            for (const q of quizData.questions) {
                // Check if question exists (by text and category) to prevent dups on reload
                let questionDoc = await Question.findOne({
                    text: q.question,
                    category: category.categoryId
                });

                if (!questionDoc) {
                    questionDoc = await Question.create({
                        text: q.question,
                        options: q.options,
                        correctOptionId: q.correctOptionId,
                        explanation: q.explanation,
                        difficulty: mapDifficulty(q.difficulty || quizData.level || 'medium'),
                        category: category.categoryId,
                        tags: [quizData.category],
                        isSystemOwned: true
                    });
                }

                questionRefs.push({
                    questionId: questionDoc._id.toString(), // Store ObjectId string for reference
                    order: order++
                });
            }

            // 3. Upsert Quiz
            // Check if quiz exists for this category
            let quizDoc = await Quiz.findOne({ categoryId: category.categoryId });
            if (!quizDoc) {
                quizDoc = await Quiz.create({
                    quizId: randomUUID(),
                    categoryId: category.categoryId,
                    title: `${quizData.category} ${quizData.level || 'Mastery'}`,
                    questions: questionRefs,
                    type: 'system',
                    difficulty: mapDifficulty(quizData.level || 'medium'),
                    createdByUserId: 'system',
                    isActive: true
                });
                logger.info(`Created Quiz for: ${category.name}`);
            } else {
                // Update questions if needed
                quizDoc.questions = questionRefs;
                await quizDoc.save();
                logger.info(`Updated Quiz for: ${category.name}`);
            }

            // 4. Populate Redis (Read-Through optimization)
            // We construct the object expected by the frontend/service
            const cachedQuiz = {
                category: category.name,
                level: quizDoc.difficulty,
                questions: quizData.questions // Using original JSON questions as they conform to IQuiz
            };

            const redisKey = `quiz:${category.categoryId.toLowerCase()}`;
            // Also cache by Name for backward comp
            const redisKeyName = `quiz:${quizData.category.toLowerCase()}`;

            await redisClient.setEx(redisKey, 3600, JSON.stringify(cachedQuiz));
            await redisClient.setEx(redisKeyName, 3600, JSON.stringify(cachedQuiz));

            // Allow listing all categories
            // await redisClient.sAdd('categories', category.categoryId); // Not used in new logic, but safe
        }

        // Cache all categories
        const allCategories = await Category.find({ isActive: true }).select('-_id -__v').lean();
        const mappedCategories = allCategories.map((c: any) => ({ ...c, id: c.categoryId }));
        await redisClient.setEx('categories:all', 3600, JSON.stringify(mappedCategories));

        logger.info(`Successfully loaded and synced ${files.length} quizzes to MongoDB & Redis.`);
    } catch (error) {
        logger.error(`Error loading quizzes: ${error}`);
    }
};
