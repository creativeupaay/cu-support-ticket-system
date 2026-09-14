import { z } from 'zod';

// ==========================================
// 1. Field & Stage Types
// ==========================================

export const FieldTypeSchema = z.enum([
  'text',
  'email',
  'textarea',
  'dropdown',
  'file',
  'checkbox',
  'radio',
]);
export type FieldType = z.infer<typeof FieldTypeSchema>;

export const FormFieldDefinitionSchema = z.object({
  id: z.string().min(1).regex(/^[a-zA-Z0-9_-]+$/, 'ID must contain only alphanumeric characters, dashes, and underscores'),
  label: z.string().min(1, 'Label is required'),
  type: FieldTypeSchema,
  required: z.boolean().default(false),
  order: z.number().int().default(0),
  placeholder: z.string().optional(),
  options: z.array(z.string()).optional(),
}).refine(
  (data) => {
    if ((data.type === 'dropdown' || data.type === 'radio') && (!data.options || data.options.length === 0)) {
      return false;
    }
    return true;
  },
  {
    message: "Options are required for dropdown and radio field types",
    path: ["options"],
  }
);
export type FormFieldDefinition = z.infer<typeof FormFieldDefinitionSchema>;

export const EmailTemplateSchema = z.object({
  subject: z.string().min(1, 'Email subject is required'),
  body: z.string().min(1, 'Email body is required'),
});
export type EmailTemplate = z.infer<typeof EmailTemplateSchema>;

export const StageDefinitionSchema = z.object({
  id: z.string().min(1).regex(/^[a-zA-Z0-9_-]+$/, 'Stage ID must contain only alphanumeric characters, dashes, and underscores'),
  name: z.string().min(1, 'Stage name is required'),
  color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Color must be a valid hex color code (e.g. #4F46E5)'),
  order: z.number().int().default(0),
  isDefault: z.boolean().default(false),
  isTerminal: z.boolean().default(false),
  emailTemplate: EmailTemplateSchema,
});
export type StageDefinition = z.infer<typeof StageDefinitionSchema>;

export const WidgetPositionSchema = z.enum([
  'bottom-right',
  'bottom-left',
  'top-right',
  'top-left',
]);
export type WidgetPosition = z.infer<typeof WidgetPositionSchema>;

export const WidgetSettingsSchema = z.object({
  primaryColor: z
    .string()
    .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Must be a valid hex color (e.g. #4F46E5)')
    .default('#4F46E5'),
  position: WidgetPositionSchema.default('bottom-right'),
  buttonText: z.string().optional().default(''),
  borderRadius: z.string().optional().default('28px'),
  title: z.string().optional().default('Customer Support'),
  subtitle: z.string().optional().default('How can our team help you today?'),
});
export type WidgetSettings = z.infer<typeof WidgetSettingsSchema>;

export function getDefaultWidgetSettings(): WidgetSettings {
  return {
    primaryColor: '#4F46E5',
    position: 'bottom-right',
    buttonText: '',
    borderRadius: '28px',
    title: 'Customer Support',
    subtitle: 'How can our team help you today?',
  };
}

// ==========================================
// 2. Domain Entities
// ==========================================

export interface Project {
  _id: string;
  organizationId: string;
  createdBy?: string;
  creatorName?: string;
  creatorEmail?: string;
  name: string;
  projectKey: string;
  projectSecretHash?: string;
  allowedDomains: string[];
  formFields: FormFieldDefinition[];
  stages: StageDefinition[];
  widgetSettings?: WidgetSettings;
  ticketCounter: number;
  ticketCount?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface StageHistoryEntry {
  stageId: string;
  stageName?: string;
  changedAt: string;
  changedBy?: string;
}

export interface InternalNote {
  _id?: string;
  body: string;
  authorId: string;
  authorName?: string;
  createdAt: string;
}

export interface Ticket {
  _id: string;
  projectId: string;
  ticketNumber: string;
  currentStageId: string;
  formResponses: Record<string, string | string[]>;
  requesterEmail: string;
  statusToken: string;
  stageHistory: StageHistoryEntry[];
  internalNotes: InternalNote[];
  createdAt: string;
  updatedAt: string;
}

export interface Agent {
  _id: string;
  organizationId: string;
  name: string;
  email: string;
  passwordHash?: string;
  role: 'admin' | 'employee' | 'owner' | 'agent';
  createdAt?: string;
}

// ==========================================
// 3. API Request / Response Schemas
// ==========================================

export const LoginRequestSchema = z.object({
  email: z.string().min(1, 'Email or username is required'),
  password: z.string().min(1, 'Password is required'),
});
export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const RegisterRequestSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Valid email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  organizationName: z.string().min(2, 'Organization name is required').optional(),
});
export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;

export const CreateProjectSchema = z.object({
  name: z.string().min(2, 'Project name is required'),
  allowedDomains: z.array(z.string().min(1)).default([]),
  formFields: z.array(FormFieldDefinitionSchema).min(1, 'At least one field is required'),
  stages: z.array(StageDefinitionSchema).min(1, 'At least one stage is required').refine(
    (stages) => stages.filter((s) => s.isDefault).length === 1,
    { message: 'Exactly one stage must be marked as default' }
  ),
  widgetSettings: WidgetSettingsSchema.optional(),
});
export type CreateProjectRequest = z.infer<typeof CreateProjectSchema>;

export const UpdateProjectSchema = CreateProjectSchema.partial();
export type UpdateProjectRequest = z.infer<typeof UpdateProjectSchema>;

export const CreateTicketPublicSchema = z.object({
  formResponses: z.record(z.union([z.string(), z.array(z.string())])),
});
export type CreateTicketPublicRequest = z.infer<typeof CreateTicketPublicSchema>;

export const UpdateTicketStageSchema = z.object({
  stageId: z.string().min(1, 'Stage ID is required'),
});
export type UpdateTicketStageRequest = z.infer<typeof UpdateTicketStageSchema>;

export const AddInternalNoteSchema = z.object({
  body: z.string().min(1, 'Note body cannot be empty'),
});
export type AddInternalNoteRequest = z.infer<typeof AddInternalNoteSchema>;

export interface ApiResponse<T> {
  data: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    [key: string]: unknown;
  };
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

// ==========================================
// 4. Default Builders & Helpers
// ==========================================

export function getDefaultFormFields(): FormFieldDefinition[] {
  return [
    {
      id: 'name',
      label: 'Your Name',
      type: 'text',
      required: true,
      order: 0,
      placeholder: 'e.g. John Doe',
    },
    {
      id: 'email',
      label: 'Email Address',
      type: 'email',
      required: true,
      order: 1,
      placeholder: 'you@example.com',
    },
    {
      id: 'issue_type',
      label: 'Issue Type',
      type: 'dropdown',
      required: true,
      order: 2,
      placeholder: 'Select issue category',
      options: ['Bug Report', 'Feature Request', 'Billing', 'General Question'],
    },
    {
      id: 'description',
      label: 'Description',
      type: 'textarea',
      required: true,
      order: 3,
      placeholder: 'Please describe the issue in detail...',
    },
    {
      id: 'screenshot',
      label: 'Screenshot / Attachment',
      type: 'file',
      required: false,
      order: 4,
    },
  ];
}

export function getDefaultStages(): StageDefinition[] {
  return [
    {
      id: 'open',
      name: 'Open',
      color: '#3B82F6', // Blue
      order: 0,
      isDefault: true,
      isTerminal: false,
      emailTemplate: {
        subject: '[{{ticketNumber}}] Ticket Received: {{project.name}}',
        body: `<div style="font-family: sans-serif; line-height: 1.5; color: #1f2937;">
  <h2 style="color: #3b82f6;">We've received your ticket</h2>
  <p>Hi there,</p>
  <p>Your support ticket <strong>{{ticketNumber}}</strong> has been submitted to <strong>{{project.name}}</strong> and is currently in <strong>{{stageName}}</strong> status.</p>
  <p>Our support team will review it shortly.</p>
  <p style="margin-top: 24px;">
    <a href="{{statusUrl}}" style="background-color: #4f46e5; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 6px; display: inline-block;">View Ticket Status</a>
  </p>
  <p style="margin-top: 24px; font-size: 13px; color: #6b7280;">You can check your status anytime using the link above. No login required.</p>
</div>`,
      },
    },
    {
      id: 'in_review',
      name: 'In Review',
      color: '#F59E0B', // Amber
      order: 1,
      isDefault: false,
      isTerminal: false,
      emailTemplate: {
        subject: '[{{ticketNumber}}] Status Update: In Review',
        body: `<div style="font-family: sans-serif; line-height: 1.5; color: #1f2937;">
  <h2 style="color: #f59e0b;">Your ticket is being reviewed</h2>
  <p>Your ticket <strong>{{ticketNumber}}</strong> is now <strong>In Review</strong> by our support team.</p>
  <p>We are investigating your request and will keep you updated.</p>
  <p style="margin-top: 24px;">
    <a href="{{statusUrl}}" style="background-color: #4f46e5; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 6px; display: inline-block;">Check Progress</a>
  </p>
</div>`,
      },
    },
    {
      id: 'in_progress',
      name: 'In Progress',
      color: '#8B5CF6', // Purple
      order: 2,
      isDefault: false,
      isTerminal: false,
      emailTemplate: {
        subject: '[{{ticketNumber}}] Update: Work in Progress',
        body: `<div style="font-family: sans-serif; line-height: 1.5; color: #1f2937;">
  <h2 style="color: #8b5cf6;">We're working on your ticket</h2>
  <p>Your ticket <strong>{{ticketNumber}}</strong> is now <strong>In Progress</strong>.</p>
  <p style="margin-top: 24px;">
    <a href="{{statusUrl}}" style="background-color: #4f46e5; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 6px; display: inline-block;">View Live Status</a>
  </p>
</div>`,
      },
    },
    {
      id: 'resolved',
      name: 'Resolved',
      color: '#10B981', // Emerald
      order: 3,
      isDefault: false,
      isTerminal: true,
      emailTemplate: {
        subject: '[{{ticketNumber}}] Resolved: Your ticket has been resolved',
        body: `<div style="font-family: sans-serif; line-height: 1.5; color: #1f2937;">
  <h2 style="color: #10b981;">Your ticket has been resolved</h2>
  <p>Great news! Your ticket <strong>{{ticketNumber}}</strong> has been marked as <strong>Resolved</strong>.</p>
  <p>If you have any further questions or if this issue persists, please feel free to reach out to us.</p>
  <p style="margin-top: 24px;">
    <a href="{{statusUrl}}" style="background-color: #10b981; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 6px; display: inline-block;">View Resolution Details</a>
  </p>
</div>`,
      },
    },
    {
      id: 'closed',
      name: 'Closed',
      color: '#6B7280', // Gray
      order: 4,
      isDefault: false,
      isTerminal: true,
      emailTemplate: {
        subject: '[{{ticketNumber}}] Ticket Closed',
        body: `<div style="font-family: sans-serif; line-height: 1.5; color: #1f2937;">
  <h2 style="color: #6b7280;">Ticket Closed</h2>
  <p>Your ticket <strong>{{ticketNumber}}</strong> has been closed. Thank you for contacting support.</p>
  <p style="margin-top: 24px;">
    <a href="{{statusUrl}}" style="background-color: #6b7280; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 6px; display: inline-block;">View Archive</a>
  </p>
</div>`,
      },
    },
  ];
}

// ==========================================
// 5. Template Token Replacer & Sanitizer
// ==========================================

export function escapeHtml(str: string): string {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export interface RenderTemplateContext {
  ticket: {
    ticketNumber: string;
    requesterEmail: string;
    formResponses?: Record<string, string | string[]>;
  };
  project: {
    name: string;
    projectKey?: string;
  };
  stageName: string;
  statusUrl: string;
}

export function renderTemplate(
  template: EmailTemplate,
  context: RenderTemplateContext
): { subject: string; body: string } {
  const replaceTokens = (text: string, isHtml: boolean): string => {
    let result = text;

    const sanitize = (val: string) => (isHtml ? escapeHtml(val) : val);

    result = result.replace(/{{\s*ticketNumber\s*}}/g, sanitize(context.ticket.ticketNumber || ''));
    result = result.replace(/{{\s*stageName\s*}}/g, sanitize(context.stageName || ''));
    result = result.replace(/{{\s*statusUrl\s*}}/g, context.statusUrl || '');
    result = result.replace(/{{\s*project\.name\s*}}/g, sanitize(context.project.name || ''));
    result = result.replace(/{{\s*requesterEmail\s*}}/g, sanitize(context.ticket.requesterEmail || ''));

    // Dynamic field replacement: {{field.<id>}}
    if (context.ticket.formResponses) {
      for (const [fieldId, value] of Object.entries(context.ticket.formResponses)) {
        const regex = new RegExp(`{{\\s*field\\.${fieldId}\\s*}}`, 'g');
        const formattedValue = Array.isArray(value) ? value.join(', ') : (value || '');
        result = result.replace(regex, sanitize(formattedValue));
      }
    }

    // Clean up any remaining unreplaced {{field.*}} tokens
    result = result.replace(/{{\s*field\.[a-zA-Z0-9_-]+\s*}}/g, '');

    return result;
  };

  return {
    subject: replaceTokens(template.subject, false),
    body: replaceTokens(template.body, true),
  };
}

// ==========================================
// 6. Dynamic Form Responses Validation
// ==========================================

export function validateFormResponses(
  responses: Record<string, unknown>,
  fieldDefs: FormFieldDefinition[]
): {
  isValid: boolean;
  sanitized: Record<string, string | string[]>;
  errors: Record<string, string>;
  requesterEmail?: string;
} {
  const errors: Record<string, string> = {};
  const sanitized: Record<string, string | string[]> = {};
  let detectedEmail: string | undefined;

  for (const field of fieldDefs) {
    const rawVal = responses[field.id];

    // Check required
    if (field.required) {
      if (rawVal === undefined || rawVal === null || rawVal === '' || (Array.isArray(rawVal) && rawVal.length === 0)) {
        errors[field.id] = `${field.label} is required`;
        continue;
      }
    }

    if (rawVal === undefined || rawVal === null || rawVal === '') {
      continue;
    }

    // Type-specific validation
    switch (field.type) {
      case 'email': {
        const emailStr = String(rawVal).trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailStr)) {
          errors[field.id] = 'Must be a valid email address';
        } else {
          sanitized[field.id] = emailStr;
          if (!detectedEmail) detectedEmail = emailStr;
        }
        break;
      }
      case 'text':
      case 'textarea': {
        sanitized[field.id] = String(rawVal).trim();
        break;
      }
      case 'dropdown':
      case 'radio': {
        const strVal = String(rawVal);
        if (field.options && !field.options.includes(strVal)) {
          errors[field.id] = `Must be one of: ${field.options.join(', ')}`;
        } else {
          sanitized[field.id] = strVal;
        }
        break;
      }
      case 'checkbox': {
        if (Array.isArray(rawVal)) {
          sanitized[field.id] = rawVal.map((v) => String(v));
        } else {
          sanitized[field.id] = String(rawVal);
        }
        break;
      }
      case 'file': {
        // Expect URL string returned from Cloudinary direct upload
        sanitized[field.id] = String(rawVal).trim();
        break;
      }
      default:
        sanitized[field.id] = String(rawVal);
    }
  }

  // Fallback requester email: if no email field was explicitly named, check if any field with type 'email' exists
  if (!detectedEmail) {
    const emailField = fieldDefs.find((f) => f.type === 'email');
    if (emailField && sanitized[emailField.id]) {
      detectedEmail = sanitized[emailField.id] as string;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    sanitized,
    errors,
    requesterEmail: detectedEmail,
  };
}

// ==========================================
// 7. Embed Snippets Generator
// ==========================================

export type EmbedMode = 'floating' | 'button' | 'link' | 'inline' | 'react';
export type EmbedFramework = 'html' | 'tailwind' | 'react';

export interface GenerateEmbedSnippetOptions {
  projectKey: string;
  projectName?: string;
  settings?: Partial<WidgetSettings>;
  widgetUrl?: string;
}

export function generateEmbedSnippets(opts: GenerateEmbedSnippetOptions): {
  floating: { html: string; react: string };
  button: { html: string; tailwind: string; react: string };
  link: { html: string; tailwind: string; react: string };
  inline: { html: string; iframe: string; react: string };
  react: { tsx: string };
} {
  const widgetUrl = (opts.widgetUrl || 'http://localhost:5174').replace(/\/+$/, '');
  const key = opts.projectKey || 'PROJECT_KEY';
  const color = opts.settings?.primaryColor || '#4F46E5';
  const position = opts.settings?.position || 'bottom-right';
  const text = opts.settings?.buttonText || '';
  const radius = opts.settings?.borderRadius || '28px';

  return {
    floating: {
      html: `<!-- SupportHub Floating Launcher Widget -->
<script
  src="${widgetUrl}/widget.js"
  data-project-key="${key}"
  data-position="${position}"
  data-button-color="${color}"${text ? `\n  data-button-text="${text}"` : ''}
  data-border-radius="${radius}"
  async>
</script>`,
      react: `// In your Next.js root layout or React App.tsx:
import Script from 'next/script';

export function SupportWidget() {
  return (
    <Script
      src="${widgetUrl}/widget.js"
      data-project-key="${key}"
      data-position="${position}"
      data-button-color="${color}"${text ? `\n      data-button-text="${text}"` : ''}
      data-border-radius="${radius}"
      strategy="afterInteractive"
    />
  );
}`,
    },
    button: {
      html: `<!-- 1. Custom Button Trigger -->
<button
  type="button"
  data-support-trigger
  style="background-color: ${color}; color: #ffffff; padding: 10px 20px; border-radius: ${radius === '28px' ? '9999px' : radius}; font-weight: 500; font-size: 14px; border: none; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.12);">
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/>
  </svg>
  <span>${text || 'Contact Support'}</span>
</button>

<!-- 2. SupportHub Loader Script (Launcher button hidden) -->
<script src="${widgetUrl}/widget.js" data-project-key="${key}" data-hide-launcher="true" async></script>`,
      tailwind: `<!-- Tailwind CSS Button Trigger -->
<button
  type="button"
  data-support-trigger
  class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg shadow-sm hover:opacity-90 transition-opacity cursor-pointer"
  style="background-color: ${color};">
  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/>
  </svg>
  <span>${text || 'Contact Support'}</span>
</button>

<!-- SupportHub Loader Script (Launcher button hidden) -->
<script src="${widgetUrl}/widget.js" data-project-key="${key}" data-hide-launcher="true" async></script>`,
      react: `// React Button Trigger Component
import React, { useEffect } from 'react';

export function SupportButton() {
  useEffect(() => {
    if (!document.querySelector('script[data-project-key="${key}"]')) {
      const script = document.createElement('script');
      script.src = '${widgetUrl}/widget.js';
      script.setAttribute('data-project-key', '${key}');
      script.setAttribute('data-hide-launcher', 'true');
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  return (
    <button
      type="button"
      data-support-trigger
      onClick={() => (window as any).SupportHub?.open()}
      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg shadow-sm cursor-pointer hover:opacity-90 transition-opacity"
      style={{ backgroundColor: '${color}' }}
    >
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/>
      </svg>
      <span>${text || 'Contact Support'}</span>
    </button>
  );
}`,
    },
    link: {
      html: `<!-- Normal Text Link Trigger (e.g. for header or footer) -->
<a
  href="#support"
  data-support-trigger
  style="color: ${color}; font-size: 14px; font-weight: 500; text-decoration: none; display: inline-flex; align-items: center; gap: 4px; cursor: pointer;">
  <span>${text || 'Need help? Contact support'}</span> &rarr;
</a>

<script src="${widgetUrl}/widget.js" data-project-key="${key}" data-hide-launcher="true" async></script>`,
      tailwind: `<!-- Tailwind Text Link Trigger -->
<a
  href="#support"
  data-support-trigger
  class="text-sm font-medium hover:underline inline-flex items-center gap-1 cursor-pointer transition-colors"
  style="color: ${color};">
  <span>${text || 'Need help? Contact support'}</span> &rarr;
</a>

<script src="${widgetUrl}/widget.js" data-project-key="${key}" data-hide-launcher="true" async></script>`,
      react: `// React Text Link Trigger
import React from 'react';

export function SupportLink() {
  return (
    <a
      href="#support"
      data-support-trigger
      onClick={(e) => {
        e.preventDefault();
        (window as any).SupportHub?.open();
      }}
      className="text-sm font-medium hover:underline inline-flex items-center gap-1 cursor-pointer"
      style={{ color: '${color}' }}
    >
      <span>${text || 'Need help? Contact support'}</span> &rarr;
    </a>
  );
}`,
    },
    inline: {
      html: `<!-- 1. Container where support intake form renders inline -->
<div id="supporthub-inline-desk" style="width: 100%; max-width: 480px; height: 640px; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0;"></div>

<!-- 2. SupportHub Loader Script with inline target selector -->
<script
  src="${widgetUrl}/widget.js"
  data-project-key="${key}"
  data-inline-target="#supporthub-inline-desk"
  async>
</script>`,
      iframe: `<!-- Direct Iframe Embed (Zero dependency) -->
<iframe
  src="${widgetUrl}/?key=${key}&inline=true"
  title="Customer Support Intake Form"
  style="width: 100%; max-width: 480px; height: 640px; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;"
  allow="camera; microphone">
</iframe>`,
      react: `// React Inline Desk Component
import React from 'react';

export function InlineSupportDesk() {
  return (
    <div className="w-full max-w-lg h-[640px] rounded-xl overflow-hidden border border-gray-200 shadow-sm bg-white">
      <iframe
        src="${widgetUrl}/?key=${key}&inline=true"
        title="Customer Support Form"
        className="w-full h-full border-0"
        allow="camera; microphone"
      />
    </div>
  );
}`,
    },
    react: {
      tsx: `import React, { useEffect } from 'react';

interface SupportWidgetProps {
  mode?: 'floating' | 'button' | 'link' | 'inline';
  className?: string;
  buttonText?: string;
}

/**
 * Universal SupportHub Client Component
 */
export const SupportHubWidget: React.FC<SupportWidgetProps> = ({
  mode = 'floating',
  className = '',
  buttonText = '${text || 'Contact Support'}',
}) => {
  const widgetUrl = '${widgetUrl}';
  const projectKey = '${key}';

  useEffect(() => {
    if (mode !== 'inline' && !document.querySelector(\`script[data-project-key="\${projectKey}"]\`)) {
      const script = document.createElement('script');
      script.src = \`\${widgetUrl}/widget.js\`;
      script.setAttribute('data-project-key', projectKey);
      if (mode === 'button' || mode === 'link') {
        script.setAttribute('data-hide-launcher', 'true');
      }
      script.async = true;
      document.body.appendChild(script);
    }
  }, [mode, projectKey, widgetUrl]);

  if (mode === 'inline') {
    return (
      <div className={\`w-full max-w-lg h-[640px] rounded-xl overflow-hidden border border-gray-200 shadow-sm bg-white \${className}\`}>
        <iframe
          src={\`\${widgetUrl}/?key=\${projectKey}&inline=true\`}
          title="Customer Support Form"
          className="w-full h-full border-0"
          allow="camera; microphone"
        />
      </div>
    );
  }

  if (mode === 'link') {
    return (
      <a
        href="#support"
        data-support-trigger
        onClick={(e) => {
          e.preventDefault();
          (window as any).SupportHub?.open();
        }}
        className={\`text-sm font-medium hover:underline inline-flex items-center gap-1 cursor-pointer \${className}\`}
        style={{ color: '${color}' }}
      >
        <span>{buttonText}</span> &rarr;
      </a>
    );
  }

  if (mode === 'button') {
    return (
      <button
        type="button"
        data-support-trigger
        onClick={() => (window as any).SupportHub?.open()}
        className={\`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg shadow-sm hover:opacity-90 transition-opacity cursor-pointer \${className}\`}
        style={{ backgroundColor: '${color}' }}
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/>
        </svg>
        <span>{buttonText}</span>
      </button>
    );
  }

  // mode === 'floating' (handled by loader script)
  return null;
};`,
    },
  };
}
