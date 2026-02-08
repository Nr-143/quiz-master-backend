import mongoose, { Document, Schema } from 'mongoose';

export interface IQuiz extends Document {
    quizId: string;
    categoryId: string; // Reference to Category.categoryId
    title: string;
    questions: Array<{
        questionId: string; // Reference to Question._id or new string ID if applicable
        order: number;
    }>;
    type: 'system' | 'user';
    createdByUserId?: string;
    difficulty: 'easy' | 'medium' | 'hard';
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const quizSchema = new Schema<IQuiz>({
    quizId: { type: String, required: true, unique: true, index: true },
    categoryId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    questions: [{
        questionId: { type: String, required: true },
        order: { type: Number, required: true }
    }],
    type: { type: String, enum: ['system', 'user'], default: 'system', required: true },
    createdByUserId: { type: String, index: true },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
    isActive: { type: Boolean, default: true }
}, {
    timestamps: true,
    toJSON: {
        transform: function (doc, ret: any) {
            delete ret._id;
            delete ret.__v;
        }
    }
});

// Index for efficient retrieval
quizSchema.index({ categoryId: 1, difficulty: 1 });

export const Quiz = mongoose.model<IQuiz>('Quiz', quizSchema);
