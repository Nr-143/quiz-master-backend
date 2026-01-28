import mongoose from 'mongoose';
import { config } from './env.config';
import logger from '../utils/logger';

const connectDB = async (): Promise<void> => {
    try {
        const conn = await mongoose.connect(config.mongoUri);
        logger.info(`MongoDB Connected: ${conn.connection.host}`);

        mongoose.connection.on('error', (err) => {
            logger.error(`MongoDB connection error: ${err}`);
        });

        mongoose.connection.on('disconnected', () => {
            logger.warn('MongoDB disconnected. Attempting to reconnect...');
        });
    } catch (error) {
        logger.error(`Error connecting to MongoDB: ${error}`);
        process.exit(1);
    }
};

export default connectDB;
