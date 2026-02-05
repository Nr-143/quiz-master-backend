import mongoose, { Schema, Document } from 'mongoose';

export interface IUserCategory extends Document {
  name: string;
  description?: string;
  ownerId: string;
  isPrivate: boolean;
  shareSettings: {
    isShared: boolean;
    shareLink?: string;
    permissions: 'view' | 'edit';
    sharedWith: string[];
  };
  questionCount: number;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const userCategorySchema = new Schema<IUserCategory>({
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  ownerId: { type: String, required: true, index: true },
  isPrivate: { type: Boolean, default: true },
  shareSettings: {
    isShared: { type: Boolean, default: false },
    shareLink: { type: String },
    permissions: { type: String, enum: ['view', 'edit'], default: 'view' },
    sharedWith: [{ type: String }]
  },
  questionCount: { type: Number, default: 0 },
  viewCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

userCategorySchema.index({ ownerId: 1, createdAt: -1 });
userCategorySchema.index({ 'shareSettings.shareLink': 1 });

export const UserCategory = mongoose.model<IUserCategory>('UserCategory', userCategorySchema);