import mongoose, { Document, Schema } from 'mongoose';

export interface IExamQuestion extends Document {
    examId: string; // Reference to Exam.examId
    quizId: string; // Reference to Quiz.quizId
    questionId: string; // Reference to Question._id
    categoryId: string; // Reference to Category.categoryId
    createdAt: Date;
}

const examQuestionSchema = new Schema<IExamQuestion>({
    examId: { type: String, required: true, index: true },
    quizId: { type: String, required: true, index: true },
    questionId: { type: String, required: true },
    categoryId: { type: String, required: true }
}, {
    timestamps: { createdAt: true, updatedAt: false }
});

// Composite index for efficient exam generation
examQuestionSchema.index({ examId: 1, quizId: 1 });

export const ExamQuestion = mongoose.model<IExamQuestion>('ExamQuestion', examQuestionSchema);
