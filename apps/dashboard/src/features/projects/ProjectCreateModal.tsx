import React, { useState } from 'react';
import { X, Check, Copy, AlertTriangle, ArrowRight, ArrowLeft, Layers, CheckCircle2 } from 'lucide-react';
import { apiClient } from '../../lib/api';
import { useProject } from '../../context/ProjectContext';
import { FieldBuilder } from './FieldBuilder';
import { StageBuilder } from './StageBuilder';
import { EmbedCodeConfigurator } from './EmbedCodeConfigurator';
import {
  getDefaultFormFields,
  getDefaultStages,
  FormFieldDefinition,
  StageDefinition,
} from '@support-hub/shared-types';

interface ProjectCreateModalProps {
  onClose: () => void;
}

export const ProjectCreateModal: React.FC<ProjectCreateModalProps> = ({ onClose }) => {
  const { refetchProjects, setCurrentProject } = useProject();

  // Wizard Steps: 1: Form Fields, 2: Stages, 3: Embed & Success
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form State
  const [name, setName] = useState('');
  const [allowedDomains, setAllowedDomains] = useState('*');
  const [formFields, setFormFields] = useState<FormFieldDefinition[]>(getDefaultFormFields());
  const [stages, setStages] = useState<StageDefinition[]>(getDefaultStages());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Success result from API
  const [createdResult, setCreatedResult] = useState<{
    projectKey: string;
    projectSecret: string;
    name: string;
    projectId?: string;
  } | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);

  // Validate step 1 and proceed to step 2
  const handleProceedToStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a Project Name before proceeding');
      return;
    }
    if (formFields.length === 0) {
      setError('At least one form field is required');
      return;
    }
    setError(null);
    setStep(2);
  };

  // Submit and create project
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Project name is required');
      setStep(1);
      return;
    }

    // Verify default stage
    const defaultCount = stages.filter((s) => s.isDefault).length;
    if (defaultCount !== 1) {
      setError('Exactly one stage must be designated as the default stage');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const domainsArray = allowedDomains
        .split(',')
        .map((d) => d.trim())
        .filter(Boolean);

      const res = await apiClient<{
        data: any;
      }>('/projects', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          allowedDomains: domainsArray,
          formFields,
          stages,
        }),
      });

      setCreatedResult({
        projectKey: res.data.projectKey,
        projectSecret: res.data.projectSecret,
        name: res.data.name,
        projectId: res.data._id,
      });

      refetchProjects();
      setCurrentProject(res.data);
      setStep(3);
    } catch (err: any) {
      setError(err.message || 'Failed to create project');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string, type: 'key' | 'secret') => {
    navigator.clipboard.writeText(text);
    if (type === 'key') {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    } else {
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-surface-0 border border-border rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] max-h-[850px] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-surface-1 shrink-0">
          <div className="space-y-0.5">
            <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
              <Layers className="w-4 h-4 text-brand-600" />
              {step === 1 && 'Step 1: Project Name & Intake Form Fields'}
              {step === 2 && 'Step 2: Ticket Pipeline Stages & Notifications'}
              {step === 3 && 'Step 3: Project Created & Embed Code'}
            </h2>
            <p className="text-xs text-text-secondary">
              {step === 1 && 'Configure your project details and dynamic form fields.'}
              {step === 2 && 'Customize your resolution pipeline and automated transactional email templates.'}
              {step === 3 && 'Your project is live! Copy your secret keys and integration snippets.'}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-text-muted hover:text-text-primary rounded-lg hover:bg-surface-2 transition-colors cursor-pointer"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Visual Stepper Progress Bar */}
        <div className="px-6 py-2.5 bg-surface-0 border-b border-border flex items-center justify-between gap-2 overflow-x-auto shrink-0 text-xs">
          <button
            type="button"
            onClick={() => {
              if (step === 2) setStep(1);
            }}
            disabled={step === 3}
            className={`flex items-center gap-2 px-3 py-1 rounded-full font-semibold transition-all ${
              step === 1
                ? 'bg-brand-50 text-brand-700 border border-brand-500/20 shadow-2xs'
                : step > 1
                ? 'bg-emerald-50 text-emerald-700 cursor-pointer hover:bg-emerald-100'
                : 'text-text-muted'
            }`}
          >
            {step > 1 ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <span className="w-4 h-4 rounded-full bg-brand-600 text-white text-3xs flex items-center justify-center font-bold">
                1
              </span>
            )}
            <span>1. Form Fields</span>
          </button>

          <span className="text-text-muted font-bold">&rarr;</span>

          <button
            type="button"
            onClick={() => {
              if (step === 1 && name.trim()) setStep(2);
            }}
            disabled={step === 3 || !name.trim()}
            className={`flex items-center gap-2 px-3 py-1 rounded-full font-semibold transition-all ${
              step === 2
                ? 'bg-brand-50 text-brand-700 border border-brand-500/20 shadow-2xs'
                : step > 2
                ? 'bg-emerald-50 text-emerald-700'
                : 'text-text-muted'
            }`}
          >
            {step > 2 ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <span className={`w-4 h-4 rounded-full text-3xs flex items-center justify-center font-bold ${step === 2 ? 'bg-brand-600 text-white' : 'bg-surface-2 text-text-muted'}`}>
                2
              </span>
            )}
            <span>2. Pipeline Stages</span>
          </button>

          <span className="text-text-muted font-bold">&rarr;</span>

          <div
            className={`flex items-center gap-2 px-3 py-1 rounded-full font-semibold ${
              step === 3
                ? 'bg-brand-50 text-brand-700 border border-brand-500/20 shadow-2xs'
                : 'text-text-muted'
            }`}
          >
            <span className={`w-4 h-4 rounded-full text-3xs flex items-center justify-center font-bold ${step === 3 ? 'bg-brand-600 text-white' : 'bg-surface-2 text-text-muted'}`}>
              3
            </span>
            <span>3. Embed & Deploy</span>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-3 rounded-lg bg-danger-50 border border-danger-600/30 text-danger-600 text-xs font-medium flex items-center justify-between">
              <span>{error}</span>
              <button
                type="button"
                onClick={() => setError(null)}
                className="text-danger-600 font-bold ml-2 cursor-pointer"
              >
                &times;
              </button>
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 1: General Info & Dynamic Form Fields                   */}
          {/* ============================================================ */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Project Core Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-surface-1/60 border border-border">
                <div>
                  <label className="block text-xs font-bold text-text-primary mb-1">
                    Project Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="e.g. Acme Cloud CRM"
                    className="w-full text-sm font-medium px-3 py-2 bg-surface-0 border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 shadow-2xs"
                  />
                  <p className="text-3xs text-text-muted mt-1">
                    The public display name shown on emails and headers.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-primary mb-1">
                    Allowed Origins (Domains)
                  </label>
                  <input
                    type="text"
                    value={allowedDomains}
                    onChange={(e) => setAllowedDomains(e.target.value)}
                    placeholder="app.acme.com, localhost:3000, *"
                    className="w-full text-sm font-medium px-3 py-2 bg-surface-0 border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 shadow-2xs"
                  />
                  <p className="text-3xs text-text-muted mt-1">
                    Enter domains allowed to submit tickets, or <code className="font-mono bg-surface-2 px-1 rounded">*</code> for all.
                  </p>
                </div>
              </div>

              {/* Form Fields Builder Component */}
              <div className="border-t border-border pt-4">
                <FieldBuilder fields={formFields} onChange={setFormFields} />
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 2: Pipeline Stages & Email Notification Templates      */}
          {/* ============================================================ */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="p-3.5 rounded-xl bg-brand-50/60 border border-brand-500/20 text-xs text-brand-900 flex items-center justify-between">
                <div>
                  <strong>Configuring Pipeline for:</strong> <span className="font-semibold">{name}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-brand-700 hover:underline font-semibold cursor-pointer"
                >
                  Edit Name / Fields
                </button>
              </div>

              <StageBuilder stages={stages} formFields={formFields} onChange={setStages} />
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 3: Success, One-Time Secret & Embed Configurator        */}
          {/* ============================================================ */}
          {step === 3 && createdResult && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Critical Secret Warning */}
              <div className="p-4 rounded-xl bg-warning-50 border border-warning-600/30 flex items-start gap-3 shadow-2xs">
                <AlertTriangle className="w-5 h-5 text-warning-600 shrink-0 mt-0.5" />
                <div className="text-xs text-text-primary space-y-1">
                  <p className="font-bold text-warning-700 text-sm">Save your Project Secret now!</p>
                  <p className="leading-relaxed">
                    The <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-warning-300 font-bold text-warning-800">projectSecret</code> is
                    displayed only once for security. Store it safely in your environment variables.
                  </p>
                </div>
              </div>

              {/* Keys Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-surface-1 rounded-xl border border-border space-y-2">
                  <label className="block text-2xs font-bold text-text-muted uppercase tracking-wider">
                    Public Project Key (Embed in Widget)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={createdResult.projectKey}
                      className="flex-1 font-mono text-xs px-3 py-2 bg-surface-0 border border-border rounded-lg text-text-primary font-bold select-all"
                    />
                    <button
                      type="button"
                      onClick={() => copyToClipboard(createdResult.projectKey, 'key')}
                      className="p-2 border border-border rounded-lg bg-surface-0 hover:bg-surface-2 text-text-secondary cursor-pointer transition-colors shadow-2xs"
                      title="Copy Public Key"
                    >
                      {copiedKey ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-surface-1 rounded-xl border border-border space-y-2">
                  <label className="block text-2xs font-bold text-text-muted uppercase tracking-wider">
                    Private Project Secret (Shown Once)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={createdResult.projectSecret}
                      className="flex-1 font-mono text-xs px-3 py-2 bg-surface-0 border border-border rounded-lg text-brand-700 font-bold select-all"
                    />
                    <button
                      type="button"
                      onClick={() => copyToClipboard(createdResult.projectSecret, 'secret')}
                      className="p-2 border border-border rounded-lg bg-surface-0 hover:bg-surface-2 text-text-secondary cursor-pointer transition-colors shadow-2xs"
                      title="Copy Project Secret"
                    >
                      {copiedSecret ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Multi-mode Embed Studio */}
              <div className="pt-2 border-t border-border">
                <EmbedCodeConfigurator
                  projectKey={createdResult.projectKey}
                  projectName={createdResult.name}
                  projectId={createdResult.projectId}
                />
              </div>
            </div>
          )}
        </div>

        {/* Modal Sticky Footer */}
        <div className="px-6 py-3.5 border-t border-border bg-surface-1 flex items-center justify-between gap-3 shrink-0">
          {step === 1 && (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-text-secondary hover:text-text-primary rounded-lg hover:bg-surface-2 transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleProceedToStep2}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 active:bg-brand-800 rounded-lg shadow-sm transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
              >
                <span>Next: Pipeline Stages</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setStep(1);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-text-secondary hover:text-text-primary rounded-lg hover:bg-surface-2 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Form Fields</span>
              </button>

              <button
                type="button"
                onClick={handleCreateProject}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 active:bg-brand-800 rounded-lg shadow-sm transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Creating Project...</span>
                  </>
                ) : (
                  <>
                    <span>Create Project & Get Embed Code</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </>
          )}

          {step === 3 && (
            <div className="w-full flex items-center justify-between">
              <span className="text-2xs text-text-muted">
                Setup complete! You can re-access settings anytime in the sidebar.
              </span>

              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 active:bg-brand-800 rounded-lg shadow-sm transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Done & Open Workspace</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
