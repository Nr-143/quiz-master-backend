import mongoose from 'mongoose';
import { config } from '../config/env.config';
import { Question } from '../models/question.model';
import { UserQuestion } from '../models/user-question.model';
import { questionService } from '../services/question.service';
import { User } from '../models/user.model';

async function verifyCopyLogic() {
    await mongoose.connect(config.mongoUri);
    console.log('Connected to MongoDB');

    try {
        // 1. Setup: Create a Predefined Question
        console.log('Creating Predefined Question...');
        const predefinedQ = await Question.create({
            text: 'What is the capital of France?',
            options: [
                { id: 'a', text: 'Berlin' },
                { id: 'b', text: 'Madrid' },
                { id: 'c', text: 'Paris' },
                { id: 'd', text: 'Rome' }
            ],
            correctOptionId: 'c',
            difficulty: 'easy',
            category: 'geography',
            tags: ['europe', 'basics'],
            isSystemOwned: true
        });
        console.log(`Predefined Question Created: ${predefinedQ._id}`);

        // 2. Setup: Create a Mock User
        console.log('Creating Mock User...');
        const userId = new mongoose.Types.ObjectId().toString(); // Mock user ID

        // 3. Action: Copy Question
        console.log('Copying Question to User...');
        const userQ = await questionService.copyQuestionToUser(userId, predefinedQ._id.toString());
        console.log(`User Question Created: ${userQ._id}`);

        // 4. Verification: Check Independence
        console.log('Verifying Independence...');

        // Check IDs are different
        if (userQ._id.toString() === predefinedQ._id.toString()) {
            throw new Error('FAIL: User question ID matches Predefined question ID!');
        }
        console.log('PASS: IDs are different.');

        // Check Ownership
        if (userQ.userId !== userId) {
            throw new Error(`FAIL: userId mismatch. Expected ${userId}, got ${userQ.userId}`);
        }
        console.log('PASS: userId is correct.');

        // Check Origin Reference
        if (userQ.originalQuestionId?.toString() !== predefinedQ._id.toString()) {
            throw new Error('FAIL: originalQuestionId reference is broken.');
        }
        console.log('PASS: originalQuestionId correctly links to parent.');

        // 5. Verification: Modify Copy and Check Original
        console.log('Modifying Copy...');
        userQ.question = 'What is the capital of Mars?';
        await userQ.save();

        const originalRefreshed = await Question.findById(predefinedQ._id);
        if (originalRefreshed?.text !== 'What is the capital of France?') {
            throw new Error('FAIL: Modifying copy changed the original question!');
        }
        console.log('PASS: Original question remained unchanged after modifying copy.');

        console.log('ALL TESTS PASSED. Logic is sound.');

        // Cleanup
        await Question.findByIdAndDelete(predefinedQ._id);
        await UserQuestion.findByIdAndDelete(userQ._id);

    } catch (error) {
        console.error('VERIFICATION FAILED:', error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
    }
}

// Run if called directly
if (require.main === module) {
    verifyCopyLogic();
}
