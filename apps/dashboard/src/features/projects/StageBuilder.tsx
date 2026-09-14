import React, { useState } from 'react';
import { Plus, Trash2, ArrowUp, ArrowDown, Mail, ChevronRight, ChevronDown } from 'lucide-react';
import { StageBadge } from '../../components/common/StageBadge';
import type { StageDefinition, FormFieldDefinition } from '@support-hub/shared-types';

interface StageBuilderProps {
  stages: StageDefinition[];
  formFields?: FormFieldDefinition[];
  onChange: (stages: StageDefinition[]) => void;
}

const PRESET_COLORS = [
  '#3B82F6', // Blue
  '#F59E0B', // Amber
  '#8B5CF6', // Purple
  '#10B981', // Emerald
  '#EF4444', // Red
  '#6B7280', // Gray
  '#06B6D4', // Cyan
  '#EC4899', // Pink
];

export const StageBuilder: React.FC<StageBuilderProps> = ({
  stages,
  formFields = [],
  onChange,
}) => {
  const [expandedStageIndex, setExpandedStageIndex] = useState<number | null>(null);

  const handleAddStage = () => {
    const newId = `stage_${Date.now().toString(36)}`;
    const newStage: StageDefinition = {
      id: newId,
      name: 'New Stage',
      color: '#3B82F6',
      order: stages.length,
      isDefault: stages.length === 0,
      isTerminal: false,
      emailTemplate: {
        subject: `[{{ticketNumber}}] Status Update: New Stage`,
        body: `<p>Your ticket {{ticketNumber}} is now in New Stage. View status: {{statusUrl}}</p>`,
      },
    };
    onChange([...stages, newStage]);
    setExpandedStageIndex(stages.length);
  };

  const handleUpdateStage = (index: number, updates: Partial<StageDefinition>) => {
    const updated = [...stages];
    updated[index] = { ...updated[index], ...updates };

    // If setting default, ensure others are false
    if (updates.isDefault) {
      updated.forEach((s, i) => {
        if (i !== index) s.isDefault = false;
      });
    }

    onChange(updated);
  };

  const handleDeleteStage = (index: number) => {
    if (stages.length <= 1) {
      alert('A project must have at least one stage.');
      return;
    }

    const isDeletingDefault = stages[index].isDefault;
    const updated = stages.filter((_, i) => i !== index).map((s, i) => ({ ...s, order: i }));

    // If default was deleted, assign first as default
    if (isDeletingDefault && updated.length > 0) {
      updated[0].isDefault = true;
    }

    onChange(updated);
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= stages.length) return;

    const updated = [...stages];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    const normalized = updated.map((s, i) => ({ ...s, order: i }));
    onChange(normalized);
  };

  const insertToken = (index: number, field: 'subject' | 'body', token: string) => {
    const current = stages[index].emailTemplate[field];
    handleUpdateStage(index, {
      emailTemplate: {
        ...stages[index].emailTemplate,
        [field]: `${current} ${token}`,
      },
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-text-primary">Ticket Lifecycle Stages</h3>
          <p className="text-xs text-text-secondary">
            Define pipeline stages and customized email notifications sent on each stage change.
          </p>
        </div>
        <button
          type="button"
          onClick={handleAddStage}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-md transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Stage
        </button>
      </div>

      <div className="space-y-3">
        {stages.map((stage, index) => {
          const isExpanded = expandedStageIndex === index;

          return (
            <div
              key={stage.id || index}
              className="bg-surface-0 border border-border rounded-lg shadow-xs overflow-hidden transition-all hover:border-border-strong"
            >
              {/* Header Bar */}
              <div className="p-4 flex items-center justify-between gap-3">
                {/* Reorder Buttons */}
                <div className="flex items-center gap-1 text-text-muted">
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => handleMove(index, 'up')}
                    className="p-1 hover:text-text-primary disabled:opacity-30 cursor-pointer"
                    title="Move Up"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    disabled={index === stages.length - 1}
                    onClick={() => handleMove(index, 'down')}
                    className="p-1 hover:text-text-primary disabled:opacity-30 cursor-pointer"
                    title="Move Down"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                </div>

                {/* Color swatch picker */}
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={stage.color}
                    onChange={(e) => handleUpdateStage(index, { color: e.target.value })}
                    className="w-7 h-7 rounded border border-border cursor-pointer p-0 bg-transparent"
                    title="Choose stage color"
                  />
                  <div className="hidden sm:flex gap-1">
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => handleUpdateStage(index, { color: c })}
                        className="w-4 h-4 rounded-full border border-black/10 hover:scale-110 transition-transform cursor-pointer"
                        style={{ backgroundColor: c }}
                        title={c}
                      />
                    ))}
                  </div>
                </div>

                {/* Stage Name */}
                <div className="flex-1">
                  <input
                    type="text"
                    value={stage.name}
                    onChange={(e) => handleUpdateStage(index, { name: e.target.value })}
                    placeholder="Stage Name (e.g. In Review)"
                    className="w-full text-sm font-medium px-2.5 py-1.5 bg-surface-1 border border-border rounded-md text-text-primary"
                  />
                </div>

                {/* Badge Preview */}
                <div className="hidden md:block">
                  <StageBadge name={stage.name || 'Preview'} color={stage.color} />
                </div>

                {/* Default Stage Radio */}
                <label className="flex items-center gap-1.5 text-xs text-text-secondary cursor-pointer select-none">
                  <input
                    type="radio"
                    name="defaultStageRadio"
                    checked={stage.isDefault}
                    onChange={() => handleUpdateStage(index, { isDefault: true })}
                    className="text-brand-600 focus:ring-brand-500"
                  />
                  Default
                </label>

                {/* Terminal Stage Checkbox */}
                <label className="flex items-center gap-1.5 text-xs text-text-secondary cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={stage.isTerminal}
                    onChange={(e) => handleUpdateStage(index, { isTerminal: e.target.checked })}
                    className="rounded border-border text-brand-600 focus:ring-brand-500"
                  />
                  Terminal
                </label>

                {/* Expand Email Template */}
                <button
                  type="button"
                  onClick={() => setExpandedStageIndex(isExpanded ? null : index)}
                  className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md border transition-colors cursor-pointer ${
                    isExpanded
                      ? 'bg-brand-50 border-brand-500 text-brand-600 font-medium'
                      : 'bg-surface-1 border-border text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Email</span>
                  {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </button>

                {/* Delete Button */}
                <button
                  type="button"
                  onClick={() => handleDeleteStage(index)}
                  className="p-1 text-text-muted hover:text-danger-600 rounded cursor-pointer transition-colors"
                  title="Remove Stage"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Expandable Email Template Editor */}
              {isExpanded && (
                <div className="p-4 bg-surface-1 border-t border-border space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-brand-600" />
                      Stage Transition Email Template (Resend)
                    </span>

                    {/* Token Chips */}
                    <div className="flex flex-wrap items-center gap-1 text-2xs">
                      <span className="text-text-muted mr-1">Insert token:</span>
                      {['{{ticketNumber}}', '{{stageName}}', '{{statusUrl}}', '{{project.name}}'].map((token) => (
                        <button
                          key={token}
                          type="button"
                          onClick={() => insertToken(index, 'body', token)}
                          className="px-1.5 py-0.5 bg-surface-0 border border-border rounded font-mono text-brand-600 hover:bg-brand-50 cursor-pointer"
                        >
                          {token}
                        </button>
                      ))}
                      {formFields.map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => insertToken(index, 'body', `{{field.${f.id}}}`)}
                          className="px-1.5 py-0.5 bg-surface-0 border border-border rounded font-mono text-brand-600 hover:bg-brand-50 cursor-pointer"
                          title={`Insert value of ${f.label}`}
                        >
                          {`{{field.${f.id}}}`}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1">Email Subject:</label>
                    <input
                      type="text"
                      value={stage.emailTemplate.subject}
                      onChange={(e) =>
                        handleUpdateStage(index, {
                          emailTemplate: { ...stage.emailTemplate, subject: e.target.value },
                        })
                      }
                      className="w-full text-xs px-2.5 py-1.5 bg-surface-0 border border-border rounded-md text-text-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1">
                      Email Body (HTML supported):
                    </label>
                    <textarea
                      rows={4}
                      value={stage.emailTemplate.body}
                      onChange={(e) =>
                        handleUpdateStage(index, {
                          emailTemplate: { ...stage.emailTemplate, body: e.target.value },
                        })
                      }
                      className="w-full font-mono text-xs p-2.5 bg-surface-0 border border-border rounded-md text-text-primary leading-relaxed"
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
