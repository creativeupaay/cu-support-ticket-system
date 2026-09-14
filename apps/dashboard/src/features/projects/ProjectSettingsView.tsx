import React, { useState, useEffect } from 'react';
import { Copy, Check, Save, Layers, ShieldCheck } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { apiClient } from '../../lib/api';
import { FieldBuilder } from './FieldBuilder';
import { StageBuilder } from './StageBuilder';
import { EmbedCodeConfigurator } from './EmbedCodeConfigurator';
import { EmptyState } from '../../components/common/EmptyState';
import type { FormFieldDefinition, StageDefinition } from '@support-hub/shared-types';

export const ProjectSettingsView: React.FC = () => {
  const { currentProject, refetchProjects } = useProject();

  const [name, setName] = useState('');
  const [allowedDomains, setAllowedDomains] = useState('');
  const [formFields, setFormFields] = useState<FormFieldDefinition[]>([]);
  const [stages, setStages] = useState<StageDefinition[]>([]);
  const [activeTab, setActiveTab] = useState<'fields' | 'stages' | 'embed'>('fields');
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  useEffect(() => {
    if (currentProject) {
      setName(currentProject.name);
      setAllowedDomains((currentProject.allowedDomains || []).join(', '));
      setFormFields(currentProject.formFields || []);
      setStages(currentProject.stages || []);
      setFeedback(null);
    }
  }, [currentProject]);

  if (!currentProject) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <EmptyState
          icon={Layers}
          title="No Project Selected"
          description="Please select or create a project from the top navigation to configure its settings."
        />
      </div>
    );
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setFeedback(null);

    try {
      const domains = allowedDomains
        .split(',')
        .map((d) => d.trim())
        .filter(Boolean);

      await apiClient(`/projects/${currentProject._id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: name.trim(),
          allowedDomains: domains,
          formFields,
          stages,
        }),
      });

      setFeedback({ type: 'success', message: 'Project configuration saved successfully!' });
      refetchProjects();
      setTimeout(() => setFeedback(null), 3500);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update project settings' });
    } finally {
      setIsSaving(false);
    }
  };

  const copyKey = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-text-primary tracking-tight">
            Project Settings — {currentProject.name}
          </h1>
          <p className="text-xs text-text-secondary mt-1">
            Configure dynamic fields, stage email templates, security allowlists, and embed options.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-brand-600 hover:bg-brand-700 active:bg-brand-800 rounded-md transition-colors cursor-pointer shadow-xs disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {isSaving ? 'Saving Changes...' : 'Save Configuration'}
        </button>
      </div>

      {feedback && (
        <div
          className={`p-3 rounded-md text-xs font-medium border ${
            feedback.type === 'success'
              ? 'bg-success-50 border-success-600/30 text-success-600'
              : 'bg-danger-50 border-danger-600/30 text-danger-600'
          }`}
        >
          {feedback.message}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          type="button"
          onClick={() => setActiveTab('fields')}
          className={`pb-3 px-4 text-xs font-medium border-b-2 cursor-pointer transition-colors ${
            activeTab === 'fields'
              ? 'border-brand-600 text-brand-600 font-semibold'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          Form Fields ({formFields.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('stages')}
          className={`pb-3 px-4 text-xs font-medium border-b-2 cursor-pointer transition-colors ${
            activeTab === 'stages'
              ? 'border-brand-600 text-brand-600 font-semibold'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          Pipeline Stages ({stages.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('embed')}
          className={`pb-3 px-4 text-xs font-medium border-b-2 cursor-pointer transition-colors ${
            activeTab === 'embed'
              ? 'border-brand-600 text-brand-600 font-semibold'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          Embed & Integration Options
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'fields' && (
        <div className="bg-surface-0 border border-border rounded-lg p-6">
          <FieldBuilder fields={formFields} onChange={setFormFields} />
        </div>
      )}

      {activeTab === 'stages' && (
        <div className="bg-surface-0 border border-border rounded-lg p-6">
          <StageBuilder stages={stages} formFields={formFields} onChange={setStages} />
        </div>
      )}

      {activeTab === 'embed' && (
        <div className="space-y-6">
          {/* Multi-mode Embed Studio */}
          <EmbedCodeConfigurator
            projectKey={currentProject.projectKey}
            projectName={currentProject.name}
            projectId={currentProject._id}
            initialSettings={currentProject.widgetSettings}
            onSettingsSaved={() => {
              refetchProjects();
            }}
          />

          {/* Project Details & Origins */}
          <div className="bg-surface-0 border border-border rounded-lg p-6 space-y-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-brand-600" />
              <h3 className="text-sm font-semibold text-text-primary">Origin Security & Details</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  Project Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-surface-1 border border-border rounded-md text-text-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  Public Project Key
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={currentProject.projectKey}
                    className="w-full font-mono text-xs px-3 py-2 bg-surface-2 border border-border rounded-md text-text-secondary"
                  />
                  <button
                    type="button"
                    onClick={() => copyKey(currentProject.projectKey)}
                    className="p-2 border border-border rounded-md hover:bg-surface-2 text-text-secondary cursor-pointer"
                    title="Copy Key"
                  >
                    {copiedKey ? <Check className="w-4 h-4 text-success-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  Allowed Origins / Domains (comma-separated, e.g. <code className="font-mono">app.client.com, localhost:3000</code> or <code className="font-mono">*</code> for wildcard)
                </label>
                <input
                  type="text"
                  value={allowedDomains}
                  onChange={(e) => setAllowedDomains(e.target.value)}
                  placeholder="https://app.client.com, https://admin.client.com, *"
                  className="w-full text-xs px-3 py-2 bg-surface-1 border border-border rounded-md text-text-primary"
                />
                <p className="text-2xs text-text-muted mt-1">
                  Requests sent to the public ticket submission API from any other origin will be rejected with HTTP 403.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
