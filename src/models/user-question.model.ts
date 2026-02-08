import mongoose, { Schema, Document } from 'mongoose';

export interface IUserQuestion extends Document {
  categoryId: string;
  userId: string;
  question: string;
  options: Array<{
    id: string;
    text: string;
  }>;
  correctOptionId: string;
  explanation?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  order: number;
  isFromPredefined: boolean;
  originalQuestionId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const userQuestionSchema = new Schema<IUserQuestion>({
  categoryId: { type: String, required: true, index: true },
  userId: { type: String, required: true, index: true },
  question: { type: String, required: true },
  options: [{
    id: { type: String, required: true },
    text: { type: String, required: true }
  }],
  correctOptionId: { type: String, required: true },
  explanation: { type: String, required: false },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  tags: [{ type: String }],
  order: { type: Number, default: 0 },
  isFromPredefined: { type: Boolean, default: false },
  originalQuestionId: { type: Schema.Types.ObjectId, ref: 'Question' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

userQuestionSchema.index({ categoryId: 1, order: 1 });
userQuestionSchema.index({ userId: 1, createdAt: -1 });

export const UserQuestion = mongoose.model<IUserQuestion>('UserQuestion', userQuestionSchema);