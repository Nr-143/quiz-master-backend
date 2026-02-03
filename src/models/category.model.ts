import mongoose, { Document, Schema } from 'mongoose';

export interface ICategory extends Document {
  id: string;
  name: string;
  icon: string;
  description: string;
  premium: boolean;
  questionCount: number;
  color: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<ICategory>({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  icon: { type: String, required: true },
  description: { type: String, required: true },
  premium: { type: Boolean, default: false },
  questionCount: { type: Number, default: 0 },
  color: { type: String, required: true },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

export const Category = mongoose.model<ICategory>('Category', categorySchema);