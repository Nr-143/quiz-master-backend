import mongoose, { Schema } from 'mongoose';
import { randomUUID } from 'crypto';

export interface IQuizSession {
    _id?: string;
    sessionId: string;
    userId: string;
    quizId: string; // Ref to Quiz.quizId
    categoryId: string; // Ref to Category.categoryId
    startedAt: Date;
    completedAt?: Date;
    status: 'in_progress' | 'completed' | 'abandoned';
    answeredQuestions: Array<{
        questionId: string;
        selectedOptionId: string;
        correctOptionId: string;
        isCorrect: boolean;
        hintOpened: boolean;
        timeTaken: number; // in seconds
        answeredAt: Date;
    }>;
    totalQuestions: number;
    correctAnswers: number;
    wrongAnswers: number; // Analyitcs
    skippedQuestions: number; // Analytics
    score: number;
    createdAt?: Date;
    updatedAt?: Date;
}

const QuizSessionSchema: Schema = new Schema(
    {
        sessionId: { type: String, default: randomUUID, unique: true, index: true },
        userId: { type: String, required: true, index: true },
        quizId: { type: String, required: true, index: true },
        categoryId: { type: String, required: true, index: true },
        startedAt: { type: Date, default: Date.now },
        completedAt: { type: Date },
        status: { type: String, enum: ['in_progress', 'completed', 'abandoned'], default: 'in_progress' },
        answeredQuestions: [{
            questionId: { type: String, required: true },
            selectedOptionId: { type: String, required: true },
            correctOptionId: { type: String, required: true },
            isCorrect: { type: Boolean, required: true },
            hintOpened: { type: Boolean, default: false },
            timeTaken: { type: Number, default: 0 },
            answeredAt: { type: Date, default: Date.now }
        }],
        totalQuestions: { type: Number, default: 0 },
        correctAnswers: { type: Number, default: 0 },
        wrongAnswers: { type: Number, default: 0 },
        skippedQuestions: { type: Number, default: 0 },
        score: { type: Number, default: 0 }
    },
    {
        timestamps: true,
        toJSON: {
            transform: function (doc, ret: any) {
                delete ret._id;
                delete ret.__v;
            }
        }
    }
);

// Index for efficient queries
QuizSessionSchema.index({ userId: 1, quizId: 1, status: 1 });
QuizSessionSchema.index({ userId: 1, categoryId: 1 });

export const QuizSession = mongoose.model<IQuizSession>('QuizSession', QuizSessionSchema);