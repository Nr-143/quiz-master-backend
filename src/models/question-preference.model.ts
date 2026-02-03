import mongoose, { Schema, Document } from 'mongoose';

export interface IQuestionPreference extends Document {
  userId: string;
  categoryId: string;
  selectedQuestions: string[];
  questionOrder: { questionId: string; priority: number }[];
  lastUpdated: Date;
}

const questionPreferenceSchema = new Schema<IQuestionPreference>({
  userId: { type: String, required: true },
  categoryId: { type: String, required: true },
  selectedQuestions: [{ type: String }],
  questionOrder: [{
    questionId: { type: String, required: true },
    priority: { type: Number, required: true }
  }],
  lastUpdated: { type: Date, default: Date.now }
});

questionPreferenceSchema.index({ userId: 1, categoryId: 1 }, { unique: true });

export const QuestionPreference = mongoose.model<IQuestionPreference>('QuestionPreference', questionPreferenceSchema);