import mongoose, { Schema } from 'mongoose';
import { randomUUID } from 'crypto';

export interface IQuizSession {
    _id?: string;
    sessionId: string;
    user: string;
    category: string;
    level: string;
    startedAt: Date;
    completedAt?: Date;
    status: 'active' | 'completed' | 'abandoned';
    answeredQuestions: Array<{
        questionId: string;
        selectedOptionId: string;
        correctOptionId: string;
        isCorrect: boolean;
        answeredAt: Date;
    }>;
    totalQuestions: number;
    correctAnswers: number;
    score: number;
    createdAt?: Date;
    updatedAt?: Date;
}

const QuizSessionSchema: Schema = new Schema(
    {
        sessionId: { type: String, default: randomUUID, unique: true },
        user: { type: String, ref: 'User', required: true },
        category: { type: String, required: true },
        level: { type: String, required: true, default: 'beginner' },
        startedAt: { type: Date, default: Date.now },
        completedAt: { type: Date },
        status: { type: String, enum: ['active', 'completed', 'abandoned'], default: 'active' },
        answeredQuestions: [{
            questionId: { type: String, required: true },
            selectedOptionId: { type: String, required: true },
            correctOptionId: { type: String, required: true },
            isCorrect: { type: Boolean, required: true },
            answeredAt: { type: Date, default: Date.now }
        }],
        totalQuestions: { type: Number, default: 0 },
        correctAnswers: { type: Number, default: 0 },
        score: { type: Number, default: 0 }
    },
    { 
        timestamps: true
    }
);

// Index for efficient queries
QuizSessionSchema.index({ user: 1, category: 1, status: 1 });
QuizSessionSchema.index({ sessionId: 1 });

export const QuizSession = mongoose.model<IQuizSession>('QuizSession', QuizSessionSchema);