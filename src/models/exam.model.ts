import mongoose, { Document, Schema } from 'mongoose';

export interface IExam extends Document {
  examId: string; // Explicit UUID
  name: string;
  tagline: string;
  description: string;
  entryPrice: number;
  examDate: Date;
  duration: number; // in minutes
  difficulty: 'easy' | 'medium' | 'hard';
  language: string;
  numberOfQuestions: number;
  examType: 'mcq' | 'coding' | 'mixed';
  categoryIds: string[]; // References to Category.categoryId
  passingCriteria?: string;
  benefits: string[];
  hasCertificate: boolean;
  hasRankCard: boolean;
  hasPerformanceAnalysis: boolean;
  conductedBy: string;
  studentsApplied: number;
  supportContact?: string;
  isActive: boolean;
  createdByUserId?: string; // String reference
  type: 'system' | 'user';
  createdAt: Date;
  updatedAt: Date;
}

const examSchema = new Schema<IExam>({
  examId: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true, trim: true },
  tagline: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  entryPrice: { type: Number, required: true, min: 0 },
  examDate: { type: Date, required: true },
  duration: { type: Number, required: true, min: 1 },
  difficulty: {
    type: String,
    required: true,
    enum: ['easy', 'medium', 'hard']
  },
  language: { type: String, required: true, default: 'English' },
  numberOfQuestions: { type: Number, required: true, min: 1 },
  examType: {
    type: String,
    required: true,
    enum: ['mcq', 'coding', 'mixed']
  },
  categoryIds: [{ type: String, required: true }], // Array of categoryId strings
  passingCriteria: { type: String },
  benefits: [{ type: String, required: true }],
  hasCertificate: { type: Boolean, default: false },
  hasRankCard: { type: Boolean, default: false },
  hasPerformanceAnalysis: { type: Boolean, default: false },
  conductedBy: { type: String, required: true },
  studentsApplied: { type: Number, default: 0 },
  supportContact: { type: String },
  isActive: { type: Boolean, default: true },
  createdByUserId: { type: String, index: true },
  type: { type: String, enum: ['system', 'user'], default: 'system', required: true }
}, {
  timestamps: true,
  toJSON: {
    transform: function (doc, ret: any) {
      delete ret._id;
      delete ret.__v;
    }
  }
});

// Indexes
examSchema.index({ examDate: 1 });
examSchema.index({ difficulty: 1 });
examSchema.index({ examType: 1 });
examSchema.index({ isActive: 1 });
examSchema.index({ categoryIds: 1 });

export const Exam = mongoose.model<IExam>('Exam', examSchema);