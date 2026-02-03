import mongoose, { Document, Schema } from 'mongoose';

export interface IExam extends Document {
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
  passingCriteria?: string;
  benefits: string[];
  hasCertificate: boolean;
  hasRankCard: boolean;
  hasPerformanceAnalysis: boolean;
  conductedBy: string;
  studentsApplied: number;
  supportContact?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const examSchema = new Schema<IExam>({
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
  passingCriteria: { type: String },
  benefits: [{ type: String, required: true }],
  hasCertificate: { type: Boolean, default: false },
  hasRankCard: { type: Boolean, default: false },
  hasPerformanceAnalysis: { type: Boolean, default: false },
  conductedBy: { type: String, required: true },
  studentsApplied: { type: Number, default: 0 },
  supportContact: { type: String },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

// Indexes
examSchema.index({ examDate: 1 });
examSchema.index({ difficulty: 1 });
examSchema.index({ examType: 1 });
examSchema.index({ isActive: 1 });

export const Exam = mongoose.model<IExam>('Exam', examSchema);