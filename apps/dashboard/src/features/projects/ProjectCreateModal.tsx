import React, { useState } from 'react';
import { X, Check, Copy, AlertTriangle, ArrowRight } from 'lucide-react';
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

  const [step, setStep] = useState<'form' | 'success'>('form');
  const [name, setName] = useState('');
  const [allowedDomains, setAllowedDomains] = useState('*');
  const [formFields, setFormFields] = useState<FormFieldDefinition[]>(getDefaultFormFields());
  const [stages, setStages] = useState<StageDefinition[]>(getDefaultStages());
  const [tab, setTab] = useState<'fields' | 'stages'>('fields');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Success result
  const [createdResult, setCreatedResult] = useState<{
    projectKey: string;
    projectSecret: string;
    name: string;
    projectId?: string;
  } | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Project name is required');
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
      setStep('success');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-surface-0 border border-border rounded-xl shadow-xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-surface-1">
          <div>
            <h2 className="text-base font-semibold text-text-primary">
              {step === 'form' ? 'Create New Support Project' : 'Project Created Successfully'}
            </h2>
            <p className="text-xs text-text-secondary">
              {step === 'form'
                ? 'Configure intake form fields, pipeline stages, and security allowlists.'
                : 'Save your project keys securely before closing this window.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-text-muted hover:text-text-primary rounded-md cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        {step === 'form' ? (
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              {error && (
                <div className="p-3 rounded-md bg-danger-50 border border-danger-600/20 text-danger-600 text-xs font-medium">
                  {error}
                </div>
              )}

              {/* General Settings */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">
                    Project Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Acme SaaS Platform"
                    className="w-full text-sm px-3 py-2 bg-surface-1 border border-border rounded-md text-text-primary focus:bg-surface-0"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">
                    Allowed Domains (comma-separated, or * for all)
                  </label>
                  <input
                    type="text"
                    value={allowedDomains}
                    onChange={(e) => setAllowedDomains(e.target.value)}
                    placeholder="e.g. app.acme.com, localhost:3000, *"
                    className="w-full text-sm px-3 py-2 bg-surface-1 border border-border rounded-md text-text-primary focus:bg-surface-0"
                  />
                </div>
              </div>

              {/* Tabs for Fields & Stages */}
              <div>
                <div className="flex border-b border-border mb-4">
                  <button
                    type="button"
                    onClick={() => setTab('fields')}
                    className={`pb-2 px-4 text-xs font-medium border-b-2 cursor-pointer transition-colors ${
                      tab === 'fields'
                        ? 'border-brand-600 text-brand-600 font-semibold'
                        : 'border-transparent text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    Intake Form Fields ({formFields.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setTab('stages')}
                    className={`pb-2 px-4 text-xs font-medium border-b-2 cursor-pointer transition-colors ${
                      tab === 'stages'
                        ? 'border-brand-600 text-brand-600 font-semibold'
                        : 'border-transparent text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    Ticket Pipeline Stages ({stages.length})
                  </button>
                </div>

                {tab === 'fields' ? (
                  <FieldBuilder fields={formFields} onChange={setFormFields} />
                ) : (
                  <StageBuilder stages={stages} formFields={formFields} onChange={setStages} />
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-border bg-surface-1 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-text-secondary hover:text-text-primary cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-brand-600 hover:bg-brand-700 active:bg-brand-800 rounded-md transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'Creating...' : 'Create Project'}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        ) : (
          <div className="p-6 space-y-6 overflow-y-auto">
            {/* Warning banner */}
            <div className="p-4 rounded-lg bg-warning-50 border border-warning-600/30 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-warning-600 shrink-0 mt-0.5" />
              <div className="text-xs text-text-primary space-y-1">
                <p className="font-semibold text-warning-600">Save your Project Secret now!</p>
                <p>
                  The <code className="font-mono bg-warning-50 px-1 py-0.5 rounded">projectSecret</code> is
                  shown only once. It will never be displayed again after you leave this screen.
                </p>
              </div>
            </div>

            {/* Project Keys */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  Public Project Key (Embed in Widget)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={createdResult?.projectKey || ''}
                    className="flex-1 font-mono text-xs px-3 py-2 bg-surface-1 border border-border rounded-md text-text-primary"
                  />
                  <button
                    type="button"
                    onClick={() => copyToClipboard(createdResult?.projectKey || '', 'key')}
                    className="p-2 border border-border rounded-md hover:bg-surface-2 text-text-secondary cursor-pointer"
                    title="Copy Key"
                  >
                    {copiedKey ? <Check className="w-4 h-4 text-success-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  Private Project Secret (Keep Secret)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={createdResult?.projectSecret || ''}
                    className="flex-1 font-mono text-xs px-3 py-2 bg-surface-1 border border-border rounded-md text-text-primary"
                  />
                  <button
                    type="button"
                    onClick={() => copyToClipboard(createdResult?.projectSecret || '', 'secret')}
                    className="p-2 border border-border rounded-md hover:bg-surface-2 text-text-secondary cursor-pointer"
                    title="Copy Secret"
                  >
                    {copiedSecret ? <Check className="w-4 h-4 text-success-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Embed & Customization Studio */}
            {createdResult && (
              <div className="pt-2">
                <EmbedCodeConfigurator
                  projectKey={createdResult.projectKey}
                  projectName={createdResult.name}
                  projectId={createdResult.projectId}
                />
              </div>
            )}

            {/* Finish Button */}
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 text-xs font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-md transition-colors cursor-pointer"
              >
                Done & Open Project
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
