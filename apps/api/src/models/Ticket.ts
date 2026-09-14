import mongoose, { Schema, Document } from 'mongoose';
import type { StageHistoryEntry, InternalNote } from '@support-hub/shared-types';

export interface TicketDocument extends Document {
  projectId: mongoose.Types.ObjectId;
  ticketNumber: string;
  currentStageId: string;
  formResponses: Record<string, string | string[]>;
  requesterEmail: string;
  statusToken: string;
  stageHistory: StageHistoryEntry[];
  internalNotes: InternalNote[];
  createdAt: Date;
  updatedAt: Date;
}

const StageHistorySchema = new Schema<StageHistoryEntry>(
  {
    stageId: { type: String, required: true },
    stageName: { type: String },
    changedAt: { type: String, required: true },
    changedBy: { type: String },
  },
  { _id: false }
);

const InternalNoteSchema = new Schema<InternalNote>(
  {
    body: { type: String, required: true },
    authorId: { type: String, required: true },
    authorName: { type: String },
    createdAt: { type: String, required: true },
  },
  { _id: true }
);

const TicketSchema = new Schema<TicketDocument>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    ticketNumber: { type: String, required: true, index: true },
    currentStageId: { type: String, required: true, index: true },
    formResponses: { type: Schema.Types.Mixed, default: {} },
    requesterEmail: { type: String, required: true, index: true, trim: true, lowercase: true },
    statusToken: { type: String, required: true, unique: true, index: true },
    stageHistory: { type: [StageHistorySchema], default: [] },
    internalNotes: { type: [InternalNoteSchema], default: [] },
  },
  {
    timestamps: true,
  }
);

TicketSchema.index({ projectId: 1, createdAt: -1 });
TicketSchema.index({ projectId: 1, currentStageId: 1 });

export const Ticket = mongoose.model<TicketDocument>('Ticket', TicketSchema);
