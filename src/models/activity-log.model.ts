import mongoose, { Schema, Document } from 'mongoose';

export interface IActivityLog extends Document {
  userId: string;
  action: 'create' | 'edit' | 'delete' | 'view' | 'share' | 'import' | 'reorder';
  resourceType: 'category' | 'question';
  resourceId: string;
  details: any;
  timestamp: Date;
}

const activityLogSchema = new Schema<IActivityLog>({
  userId: { type: String, required: true, index: true },
  action: { 
    type: String, 
    required: true,
    enum: ['create', 'edit', 'delete', 'view', 'share', 'import', 'reorder']
  },
  resourceType: { type: String, required: true, enum: ['category', 'question'] },
  resourceId: { type: String, required: true },
  details: { type: Schema.Types.Mixed },
  timestamp: { type: Date, default: Date.now, index: true }
});

activityLogSchema.index({ userId: 1, timestamp: -1 });
activityLogSchema.index({ resourceId: 1, timestamp: -1 });

export const ActivityLog = mongoose.model<IActivityLog>('ActivityLog', activityLogSchema);