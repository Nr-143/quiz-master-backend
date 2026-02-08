import mongoose, { Schema, Document } from 'mongoose';

export interface IScore extends Document {
    userId: string;
    category: string;
    score: number;
    total: number;
    createdAt: Date;
}

const ScoreSchema: Schema = new Schema(
    {
        userId: { type: String, required: true, ref: 'User' },
        category: { type: String, required: true },
        score: { type: Number, required: true },
        total: { type: Number, required: true },
    },
    { timestamps: true }
);

export const Score = mongoose.model<IScore>('Score', ScoreSchema);
