import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

export interface IUser {
    _id?: string;
    userId: string;
    username: string;
    email: string;
    password?: string;
    phone?: string;
    qualification?: string;
    role: 'user' | 'admin' | 'teacher' | 'hr';
    xp: number;
    credits: number;
    level: number;
    stats: {
        totalQuizzes: number;
        totalQuestions: number;
        correctAnswers: number;
        accuracy: number;
        streak: number;
        longestStreak: number;
        categoryProgress: {
            [key: string]: {
                solved: number;
                correct: number;
                accuracy: number;
                lastPlayed: string;
            };
        };
    };
    comparePassword(candidatePassword: string): Promise<boolean>;
    unlockedHints: Array<{
        quizId: string;
        questionId: string;
        unlockedAt: Date;
    }>;
    createdAt?: Date;
    updatedAt?: Date;
}

const UserSchema: Schema = new Schema(
    {
        _id: { type: String, default: randomUUID }, // Explicitly define _id as String
        userId: { type: String, default: randomUUID, unique: true }, // Keep userId for backward compat if needed, or make it alias
        username: { type: String, required: true, unique: true, trim: true },
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        password: { type: String, required: true, select: false },
        phone: { type: String, trim: true },
        qualification: { type: String, trim: true },
        role: { type: String, enum: ['user', 'admin', 'teacher', 'hr'], default: 'user' },
        xp: { type: Number, default: 0 },
        credits: { type: Number, default: 50 },
        level: { type: Number, default: 1 },
        unlockedHints: [{
            quizId: { type: String, required: true },
            questionId: { type: String, required: true },
            unlockedAt: { type: Date, default: Date.now }
        }],
        stats: {
            totalQuizzes: { type: Number, default: 0 },
            totalQuestions: { type: Number, default: 0 },
            correctAnswers: { type: Number, default: 0 },
            accuracy: { type: Number, default: 0 },
            streak: { type: Number, default: 0 },
            longestStreak: { type: Number, default: 0 },
            categoryProgress: {
                type: Map,
                of: {
                    solved: { type: Number, default: 0 },
                    correct: { type: Number, default: 0 },
                    accuracy: { type: Number, default: 0 },
                    lastPlayed: { type: String, default: '' }
                },
                default: {}
            }
        }
    },
    {
        timestamps: true
    }
);

// Hash password before saving
UserSchema.pre('save', async function (this: any, next) {
    if (!this.isModified('password')) return next();

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password!, salt);
        next();
    } catch (error: any) {
        return next(error);
    }
});

// Update accuracy when stats change
UserSchema.pre('save', function (this: any, next) {
    if (this.stats.totalQuestions > 0) {
        this.stats.accuracy = Math.round((this.stats.correctAnswers / this.stats.totalQuestions) * 100);
    }

    // Update level based on XP (every 100 XP = 1 level)
    this.level = Math.floor(this.xp / 100) + 1;

    next();
});

// Compare password method
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password as string);
};

export const User = mongoose.model<IUser>('User', UserSchema);
