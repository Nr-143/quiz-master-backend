import app from './src/app';
import { config } from './src/config/env.config';
import connectDB from './src/config/db.config';
import { connectRedis } from './src/config/redis.config';
import logger from './src/utils/logger';
import { loadQuizzes } from './src/loaders/quizLoader';

const startServer = async () => {
    try {
        // Connect to Database
        await connectDB();

        // Connect to Redis
        await connectRedis();

        // Load Quizzes
        await loadQuizzes();

        app.listen(config.port, () => {
            logger.info(`Server running in ${config.nodeEnv} mode on port ${config.port}`);
        });
    } catch (error) {
        logger.error(`Failed to start server: ${error}`);
        process.exit(1);
    }
};

startServer();
