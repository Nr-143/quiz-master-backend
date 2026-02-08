import mongoose, { Document, Schema } from 'mongoose';

export interface ICategory extends Document {
  categoryId: string; // Explicit string ID
  name: string;
  icon: string;
  description: string;
  premium: boolean;
  type: 'system' | 'user';
  createdByUserId?: string; // String reference, nullable for system
  questionCount: number;
  color: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<ICategory>({
  categoryId: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  icon: { type: String, required: true },
  description: { type: String, required: true },
  premium: { type: Boolean, default: false },
  type: { type: String, enum: ['system', 'user'], default: 'system', required: true },
  createdByUserId: { type: String, index: true }, // Indexed for looking up user categories
  questionCount: { type: Number, default: 0 },
  color: { type: String, required: true },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function (doc, ret: any) {
      delete ret._id;
      delete ret.id; // Remove duplicate if virtual
      ret.id = ret.categoryId; // Map categoryId to id for frontend compatibility
      delete ret.__v;
    }
  }
});

// Compound index for user-specific categories
categorySchema.index({ createdByUserId: 1, type: 1 });

export const Category = mongoose.model<ICategory>('Category', categorySchema);