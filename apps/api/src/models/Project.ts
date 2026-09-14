import mongoose, { Schema, Document } from 'mongoose';
import type { FormFieldDefinition, StageDefinition, WidgetSettings } from '@support-hub/shared-types';

export interface ProjectDocument extends Document {
  organizationId: string;
  createdBy?: mongoose.Types.ObjectId;
  name: string;
  projectKey: string;
  projectSecretHash: string;
  allowedDomains: string[];
  formFields: FormFieldDefinition[];
  stages: StageDefinition[];
  widgetSettings?: WidgetSettings;
  ticketCounter: number;
  createdAt: Date;
  updatedAt: Date;
}

const FormFieldSchema = new Schema<FormFieldDefinition>(
  {
    id: { type: String, required: true },
    label: { type: String, required: true },
    type: {
      type: String,
      required: true,
      enum: ['text', 'email', 'textarea', 'dropdown', 'file', 'checkbox', 'radio'],
    },
    required: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
    placeholder: { type: String },
    options: [{ type: String }],
  },
  { _id: false }
);

const StageSchema = new Schema<StageDefinition>(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    color: { type: String, required: true },
    order: { type: Number, default: 0 },
    isDefault: { type: Boolean, default: false },
    isTerminal: { type: Boolean, default: false },
    emailTemplate: {
      subject: { type: String, required: true },
      body: { type: String, required: true },
    },
  },
  { _id: false }
);

const WidgetSettingsMongooseSchema = new Schema(
  {
    primaryColor: { type: String, default: '#4F46E5' },
    position: {
      type: String,
      default: 'bottom-right',
      enum: ['bottom-right', 'bottom-left', 'top-right', 'top-left'],
    },
    buttonText: { type: String, default: '' },
    borderRadius: { type: String, default: '28px' },
    title: { type: String, default: 'Customer Support' },
    subtitle: { type: String, default: 'How can our team help you today?' },
  },
  { _id: false }
);

const ProjectSchema = new Schema<ProjectDocument>(
  {
    organizationId: { type: String, required: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'Agent', index: true },
    name: { type: String, required: true, trim: true },
    projectKey: { type: String, required: true, unique: true, index: true },
    projectSecretHash: { type: String, required: true, select: false },
    allowedDomains: [{ type: String, trim: true }],
    formFields: { type: [FormFieldSchema], default: [] },
    stages: { type: [StageSchema], default: [] },
    widgetSettings: {
      type: WidgetSettingsMongooseSchema,
      default: () => ({
        primaryColor: '#4F46E5',
        position: 'bottom-right',
        buttonText: '',
        borderRadius: '28px',
        title: 'Customer Support',
        subtitle: 'How can our team help you today?',
      }),
    },
    ticketCounter: { type: Number, default: 1000 },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for tenant and creator isolation
ProjectSchema.index({ _id: 1, organizationId: 1 });
ProjectSchema.index({ organizationId: 1, createdBy: 1 });

export const Project = mongoose.model<ProjectDocument>('Project', ProjectSchema);
