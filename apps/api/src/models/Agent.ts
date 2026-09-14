import mongoose, { Schema, Document } from 'mongoose';

export interface AgentDocument extends Document {
  organizationId: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'admin' | 'employee' | 'owner' | 'agent';
  createdAt: Date;
  updatedAt: Date;
}

const AgentSchema = new Schema<AgentDocument>(
  {
    organizationId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ['admin', 'employee', 'owner', 'agent'], default: 'employee' },
  },
  {
    timestamps: true,
  }
);

export const Agent = mongoose.model<AgentDocument>('Agent', AgentSchema);
