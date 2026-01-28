import fs from 'fs';
import path from 'path';
import { IQuiz } from '../models/quiz.interface';
import redisClient from '../config/redis.config';
import logger from '../utils/logger';

const QUIZ_DIR = path.join(__dirname, '../../static/quizzes');

export const loadQuizzes = async (): Promise<void> => {
    try {
        if (!fs.existsSync(QUIZ_DIR)) {
            logger.warn(`Quiz directory not found: ${QUIZ_DIR}`);
            return;
        }

        const files = fs.readdirSync(QUIZ_DIR).filter((file) => file.endsWith('.json'));

        for (const file of files) {
            const filePath = path.join(QUIZ_DIR, file);
            const content = fs.readFileSync(filePath, 'utf-8');
            const quiz: IQuiz = JSON.parse(content);

            // Validate structure (basic check)
            if (!quiz.category || !quiz.questions) {
                logger.error(`Invalid quiz format in file: ${file}`);
                continue;
            }

            // Store in Redis
            // Key: quiz:{category} (for specific quiz)
            // Key: categories (set of all categories)

            const redisKey = `quiz:${quiz.category.toLowerCase()}`;
            await redisClient.set(redisKey, JSON.stringify(quiz));
            await redisClient.sAdd('categories', quiz.category);

            logger.info(`Loaded quiz: ${quiz.category}`);
        }

        logger.info(`Successfully loaded ${files.length} quizzes into Redis.`);
    } catch (error) {
        logger.error(`Error loading quizzes: ${error}`);
    }
};
