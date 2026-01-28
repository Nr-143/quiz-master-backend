import { createClient } from 'redis';
import { config } from './env.config';
import logger from '../utils/logger';

const redisClient = createClient({
    url: config.redisUrl,
});

redisClient.on('error', (err) => logger.error('Redis Client Error', err));
redisClient.on('connect', () => logger.info('Redis Client Connected'));

export const connectRedis = async (): Promise<void> => {
    try {
        await redisClient.connect();
    } catch (error) {
        logger.error(`Error connecting to Redis: ${error}`);
        // Don't exit process, as Redis might be optional for some features or can be retried
    }
};

export default redisClient;
