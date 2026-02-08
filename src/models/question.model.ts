import mongoose, { Schema, Document } from 'mongoose';

export interface IQuestion extends Document {
    text: string;
    options: Array<{
        id: string;
        text: string;
    }>;
    correctOptionId: string;
    explanation?: string;
    difficulty: 'easy' | 'medium' | 'hard';
    category: string;
    tags: string[];
    isSystemOwned: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const questionSchema = new Schema<IQuestion>({
    text: { type: String, required: true },
    options: [{
        id: { type: String, required: true },
        text: { type: String, required: true }
    }],
    correctOptionId: { type: String, required: true },
    explanation: { type: String },
    difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard'],
        required: true
    },
    category: { type: String, required: true, index: true },
    tags: [{ type: String }],
    isSystemOwned: { type: Boolean, default: true, immutable: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

questionSchema.index({ category: 1, difficulty: 1 });

export const Question = mongoose.model<IQuestion>('Question', questionSchema);
