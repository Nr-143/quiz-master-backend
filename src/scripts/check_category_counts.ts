import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { UserCategory } from '../models/user-category.model';
import { UserQuestion } from '../models/user-question.model';
import path from 'path';

// Load env vars from project root
console.log('Current working directory:', process.cwd());
const envPath = path.resolve(process.cwd(), '.env');
console.log('Loading .env from:', envPath);
dotenv.config({ path: envPath });

const checkCounts = async () => {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error('MONGO_URI not found in environment variables');
        }

        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // 1. Find all categories for the user
        const userId = '697a578093d687d46ef379e3';
        const categories = await UserCategory.find({ userId });

        console.log(`Found ${categories.length} categories for user ${userId}:`);

        for (const cat of categories) {
            // 2. Count actual questions in DB for this category
            const questionCount = await UserQuestion.countDocuments({ categoryId: cat._id });

            console.log('------------------------------------------------');
            console.log(`Category: "${cat.name}"`);
            console.log(`ID: ${cat._id}`);
            console.log(`User: ${cat.userId}`);
            console.log(`Stored questionCount (in Category doc): ${cat.questionCount}`);
            console.log(`Actual Question Documents found: ${questionCount}`);

            if (cat.questionCount !== questionCount) {
                console.log(`⚠️ MISMATCH: Category says ${cat.questionCount}, but found ${questionCount} questions.`);
            } else {
                console.log('✅ Count matches.');
            }
        }

    } catch (error) {
        console.error('Error checking counts:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected');
    }
};

checkCounts();
