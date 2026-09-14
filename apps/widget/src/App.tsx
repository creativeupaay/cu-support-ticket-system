import React, { useState, useEffect } from 'react';
import {
  X,
  Send,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  RotateCcw,
} from 'lucide-react';
import type { FormFieldDefinition, WidgetSettings } from '@support-hub/shared-types';

interface ProjectSchema {
  projectKey: string;
  name: string;
  formFields: FormFieldDefinition[];
  widgetSettings?: WidgetSettings;
}

export const App: React.FC = () => {
  const [projectKey, setProjectKey] = useState<string | null>(null);
  const [schema, setSchema] = useState<ProjectSchema | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [schemaError, setSchemaError] = useState<string | null>(null);

  // Form State
  const [formResponses, setFormResponses] = useState<Record<string, any>>({});
  const [fileUploading, setFileUploading] = useState(false);
  const [fileNames, setFileNames] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Success Confirmation State
  const [submittedTicket, setSubmittedTicket] = useState<{
    ticketNumber: string;
    statusUrl: string;
    requesterEmail?: string;
  } | null>(null);

  // 1. Read projectKey from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const key = params.get('key');
    if (!key) {
      setIsLoading(false);
      setSchemaError('Missing project key. Please embed the widget with a valid data-project-key attribute.');
      return;
    }
    setProjectKey(key);
  }, []);

  // 2. Fetch Project Schema
  useEffect(() => {
    if (!projectKey) return;

    async function loadSchema() {
      setIsLoading(true);
      setSchemaError(null);

      try {
        const res = await fetch(`/api/public/v1/projects/${projectKey}/schema`);
        const json = await res.json();

        if (!res.ok) {
          throw new Error(json.error?.message || 'Could not load support form');
        }

        setSchema(json.data);

        // Initialize default responses
        const initial: Record<string, any> = {};
        json.data.formFields.forEach((field: FormFieldDefinition) => {
          if (field.type === 'dropdown' && field.options && field.options.length > 0) {
            initial[field.id] = field.options[0];
          } else if (field.type === 'checkbox') {
            initial[field.id] = [];
          } else {
            initial[field.id] = '';
          }
        });
        setFormResponses(initial);
      } catch (err: any) {
        setSchemaError(err.message || 'Support form unavailable');
      } finally {
        setIsLoading(false);
      }
    }

    loadSchema();
  }, [projectKey]);

  // Handle postMessage Close
  const handleClose = () => {
    if (window.parent) {
      window.parent.postMessage({ type: 'SUPPORT_HUB_CLOSE' }, '*');
    }
  };

  // Handle Input Changes
  const handleFieldChange = (fieldId: string, value: any) => {
    setFormResponses((prev) => ({ ...prev, [fieldId]: value }));
  };

  // Handle File Upload to Google Cloud Storage
  const handleFileUpload = async (fieldId: string, file: File) => {
    if (!projectKey) return;
    setFileUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const uploadRes = await fetch(`/api/public/v1/projects/${projectKey}/upload`, {
        method: 'POST',
        body: formData,
      });

      const uploadJson = await uploadRes.json();
      if (!uploadRes.ok) {
        throw new Error(uploadJson.error?.message || 'File upload failed');
      }

      const fileUrl = uploadJson.data?.fileUrl || uploadJson.secure_url || uploadJson.url;
      const fileName = uploadJson.data?.fileName || file.name;

      setFormResponses((prev) => ({ ...prev, [fieldId]: fileUrl }));
      setFileNames((prev) => ({ ...prev, [fieldId]: fileName }));
    } catch (err: any) {
      alert(`Upload error: ${err.message}`);
    } finally {
      setFileUploading(false);
    }
  };

  // Submit Ticket
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectKey || !schema) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch(`/api/public/v1/projects/${projectKey}/tickets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          formResponses,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || 'Failed to submit ticket');
      }

      // Find email from responses
      const emailField = schema.formFields.find((f) => f.type === 'email');
      const email = emailField ? formResponses[emailField.id] : undefined;

      setSubmittedTicket({
        ticketNumber: json.data.ticketNumber,
        statusUrl: json.data.statusUrl,
        requesterEmail: email,
      });
    } catch (err: any) {
      setSubmitError(err.message || 'Submission error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset for another submission
  const handleReset = () => {
    setSubmittedTicket(null);
    setSubmitError(null);
    if (schema) {
      const reset: Record<string, any> = {};
      schema.formFields.forEach((field) => {
        if (field.type === 'dropdown' && field.options && field.options.length > 0) {
          reset[field.id] = field.options[0];
        } else if (field.type === 'checkbox') {
          reset[field.id] = [];
        } else {
          reset[field.id] = '';
        }
      });
      setFormResponses(reset);
      setFileNames({});
    }
  };

  // Validate required fields
  const isFormValid = React.useMemo(() => {
    if (!schema) return false;
    for (const field of schema.formFields) {
      if (field.required) {
        const val = formResponses[field.id];
        if (val === undefined || val === null || val === '') return false;
        if (Array.isArray(val) && val.length === 0) return false;
        if (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(val))) return false;
      }
    }
    return true;
  }, [schema, formResponses]);

  const isInline = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('inline') === 'true';
  const primaryColor = schema?.widgetSettings?.primaryColor || '#4F46E5';
  const headerTitle = schema?.widgetSettings?.title || schema?.name || 'Customer Support';
  const headerSubtitle = schema?.widgetSettings?.subtitle || 'How can our team help you today?';

  return (
    <div className={`flex flex-col h-screen w-full bg-surface-0 ${isInline ? 'border-0' : 'border border-border shadow-md rounded-2xl'} overflow-hidden text-text-primary`}>
      {/* Top Header */}
      <div className="px-5 py-4 bg-surface-1 border-b border-border flex items-center justify-between">
        <div>
          <h1 className="text-sm font-semibold text-text-primary leading-tight">
            {headerTitle}
          </h1>
          <p className="text-2xs text-text-secondary mt-0.5">
            {headerSubtitle}
          </p>
        </div>
        {!isInline && (
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close widget"
            className="p-1 text-text-muted hover:text-text-primary rounded-md transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Body Area */}
      <div className="flex-1 overflow-y-auto p-5">
        {isLoading ? (
          <div className="h-full flex flex-col items-center justify-center space-y-3 py-16">
            <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-text-secondary">Loading support form...</span>
          </div>
        ) : schemaError ? (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-danger-50 flex items-center justify-center text-danger-600">
              <AlertCircle className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-text-primary">Unable to Open Form</h3>
            <p className="text-xs text-text-secondary">{schemaError}</p>
          </div>
        ) : submittedTicket ? (
          /* Confirmation Screen (PRD 5.3 & Design System 5) */
          <div className="h-full flex flex-col items-center justify-center text-center p-4 space-y-4 animate-in fade-in duration-200">
            <div className="w-12 h-12 rounded-full bg-success-50 border border-success-600/20 flex items-center justify-center text-success-600">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h2 className="text-base font-bold text-text-primary">We got your ticket!</h2>
              <p className="text-xs text-text-secondary max-w-xs">
                Check your email for real-time progress updates.
              </p>
            </div>

            <div className="p-3 bg-surface-1 border border-border rounded-lg w-full max-w-xs space-y-1">
              <div className="text-2xs text-text-muted uppercase tracking-wider font-semibold">
                Your Ticket Reference
              </div>
              <div className="font-mono text-base font-bold" style={{ color: primaryColor }}>
                {submittedTicket.ticketNumber}
              </div>
            </div>

            <p className="text-2xs text-text-muted max-w-xs">
              A private status link has been sent to your email. You do not need to log in to check progress.
            </p>

            <div className="pt-3 flex flex-col gap-2 w-full max-w-xs">
              <button
                type="button"
                onClick={handleReset}
                className="w-full flex items-center justify-center gap-1.5 py-2 px-4 rounded-md text-xs font-medium text-text-secondary bg-surface-1 hover:bg-surface-2 border border-border transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Submit Another Request
              </button>

              {!isInline ? (
                <button
                  type="button"
                  onClick={handleClose}
                  style={{ backgroundColor: primaryColor }}
                  className="w-full py-2 px-4 rounded-md text-xs font-medium text-white hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
                >
                  Close Window
                </button>
              ) : (
                <div className="text-center text-2xs text-text-muted">
                  Submission complete
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Dynamic Form View */
          <form onSubmit={handleSubmit} className="space-y-4">
            {submitError && (
              <div className="p-2.5 rounded bg-danger-50 border border-danger-600/30 text-danger-600 text-xs font-medium">
                {submitError}
              </div>
            )}

            {schema?.formFields.map((field) => {
              const inputId = `sh-field-${field.id}`;

              return (
                <div key={field.id} className="space-y-1 text-left">
                  {/* Real <label> element */}
                  <label
                    htmlFor={inputId}
                    className="block text-xs font-medium text-text-primary"
                  >
                    {field.label} {field.required && <span className="text-danger-600">*</span>}
                  </label>

                  {/* Input mapping by FieldType */}
                  {field.type === 'text' && (
                    <input
                      id={inputId}
                      type="text"
                      required={field.required}
                      placeholder={field.placeholder || ''}
                      value={formResponses[field.id] || ''}
                      onChange={(e) => handleFieldChange(field.id, e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-surface-1 border border-border rounded-md text-text-primary focus:bg-surface-0 shadow-2xs"
                    />
                  )}

                  {field.type === 'email' && (
                    <input
                      id={inputId}
                      type="email"
                      required={field.required}
                      placeholder={field.placeholder || 'you@example.com'}
                      value={formResponses[field.id] || ''}
                      onChange={(e) => handleFieldChange(field.id, e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-surface-1 border border-border rounded-md text-text-primary focus:bg-surface-0 shadow-2xs"
                    />
                  )}

                  {field.type === 'textarea' && (
                    <textarea
                      id={inputId}
                      rows={3}
                      required={field.required}
                      placeholder={field.placeholder || ''}
                      value={formResponses[field.id] || ''}
                      onChange={(e) => handleFieldChange(field.id, e.target.value)}
                      className="w-full text-xs p-3 bg-surface-1 border border-border rounded-md text-text-primary focus:bg-surface-0 shadow-2xs resize-none"
                    />
                  )}

                  {field.type === 'dropdown' && (
                    <select
                      id={inputId}
                      required={field.required}
                      value={formResponses[field.id] || ''}
                      onChange={(e) => handleFieldChange(field.id, e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-surface-1 border border-border rounded-md text-text-primary focus:bg-surface-0 shadow-2xs"
                    >
                      {field.placeholder && (
                        <option value="" disabled>
                          {field.placeholder}
                        </option>
                      )}
                      {(field.options || []).map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  )}

                  {field.type === 'radio' && (
                    <div className="space-y-1.5 pt-0.5">
                      {(field.options || []).map((opt) => (
                        <label
                          key={opt}
                          className="flex items-center gap-2 text-xs text-text-secondary cursor-pointer"
                        >
                          <input
                            type="radio"
                            name={inputId}
                            value={opt}
                            checked={formResponses[field.id] === opt}
                            onChange={(e) => handleFieldChange(field.id, e.target.value)}
                            className="text-brand-600 focus:ring-brand-500"
                          />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {field.type === 'checkbox' && (
                    <label className="flex items-center gap-2 text-xs text-text-secondary cursor-pointer pt-0.5">
                      <input
                        id={inputId}
                        type="checkbox"
                        checked={!!formResponses[field.id]}
                        onChange={(e) => handleFieldChange(field.id, e.target.checked)}
                        className="rounded border-border text-brand-600 focus:ring-brand-500"
                      />
                      <span>{field.placeholder || 'I confirm this information'}</span>
                    </label>
                  )}

                  {field.type === 'file' && (
                    <div className="mt-1">
                      <label
                        htmlFor={inputId}
                        className={`flex items-center justify-center gap-2 p-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors text-xs ${
                          formResponses[field.id]
                            ? 'border-success-600/50 bg-success-50/50 text-success-600'
                            : 'border-border hover:border-brand-500 bg-surface-1 hover:bg-surface-0 text-text-secondary'
                        }`}
                      >
                        {fileUploading ? (
                          <div className="flex items-center gap-2">
                            <div className="w-3.5 h-3.5 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
                            <span>Uploading screenshot...</span>
                          </div>
                        ) : formResponses[field.id] ? (
                          <div className="flex items-center gap-1.5 truncate max-w-xs">
                            <FileCheck className="w-4 h-4 text-success-600" />
                            <span className="truncate font-mono">{fileNames[field.id] || 'Attachment uploaded'}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <Upload className="w-4 h-4 text-text-muted" />
                            <span>Click to upload screenshot or file</span>
                          </div>
                        )}
                        <input
                          id={inputId}
                          type="file"
                          accept="image/*,application/pdf"
                          disabled={fileUploading}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload(field.id, file);
                          }}
                          className="hidden"
                        />
                      </label>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={!isFormValid || isSubmitting || fileUploading}
                style={{ backgroundColor: primaryColor }}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-md text-xs font-semibold text-white hover:opacity-90 active:opacity-95 shadow-sm transition-opacity cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    Submit Ticket
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Subtle Footer */}
      <div className="py-2 bg-surface-1 border-t border-border text-center text-3xs text-text-muted">
        Encrypted submission • SupportHub Network
      </div>
    </div>
  );
};
