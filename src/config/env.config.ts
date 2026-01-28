import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
    PORT: z.string().default('3000'),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    MONGO_URI: z.string().min(1, "MONGO_URI is required"),
    REDIS_URL: z.string().default('redis://localhost:6379'),
    JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
    JWT_REFRESH_SECRET: z.string().min(1, "JWT_REFRESH_SECRET is required"),
    CORS_ORIGIN: z.string().default('*'),
    RATE_LIMIT_MAX: z.string().default('100'),
});

const envVars = envSchema.parse(process.env);

export const config = {
    port: parseInt(envVars.PORT, 10),
    nodeEnv: envVars.NODE_ENV,
    mongoUri: envVars.MONGO_URI,
    redisUrl: envVars.REDIS_URL,
    jwtSecret: envVars.JWT_SECRET,
    jwtRefreshSecret: envVars.JWT_REFRESH_SECRET,
    corsOrigin: envVars.CORS_ORIGIN,
    rateLimitMax: parseInt(envVars.RATE_LIMIT_MAX, 10),
};
