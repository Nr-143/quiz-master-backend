import mongoose, { Schema, Document } from 'mongoose';

export interface IScore extends Document {
    user: mongoose.Types.ObjectId;
    category: string;
    score: number;
    total: number;
    createdAt: Date;
}

const ScoreSchema: Schema = new Schema(
    {
        user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        category: { type: String, required: true },
        score: { type: Number, required: true },
        total: { type: Number, required: true },
    },
    { timestamps: true }
);

export const Score = mongoose.model<IScore>('Score', ScoreSchema);
