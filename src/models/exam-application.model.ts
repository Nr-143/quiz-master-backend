import mongoose, { Document, Schema } from 'mongoose';

export interface IExamApplication extends Document {
  examId: mongoose.Types.ObjectId;
  userId: string;
  applicationDate: Date;
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentId?: string;
  agreedToTerms: boolean;
  status: 'applied' | 'appeared' | 'completed' | 'cancelled';
  score?: number;
  rank?: number;
  certificateUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const examApplicationSchema = new Schema<IExamApplication>({
  examId: {
    type: Schema.Types.ObjectId,
    ref: 'Exam',
    required: true
  },
  userId: {
    type: String,
    ref: 'User',
    required: true
  },
  applicationDate: { type: Date, default: Date.now },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentId: { type: String },
  agreedToTerms: { type: Boolean, required: true },
  status: {
    type: String,
    enum: ['applied', 'appeared', 'completed', 'cancelled'],
    default: 'applied'
  },
  score: { type: Number, min: 0, max: 100 },
  rank: { type: Number, min: 1 },
  certificateUrl: { type: String }
}, {
  timestamps: true
});

// Compound index to prevent duplicate applications
examApplicationSchema.index({ examId: 1, userId: 1 }, { unique: true });
examApplicationSchema.index({ userId: 1 });
examApplicationSchema.index({ paymentStatus: 1 });
examApplicationSchema.index({ status: 1 });

export const ExamApplication = mongoose.model<IExamApplication>('ExamApplication', examApplicationSchema);