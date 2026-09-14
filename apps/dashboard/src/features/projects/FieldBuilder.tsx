import React from 'react';
import { Plus, Trash2, ArrowUp, ArrowDown, HelpCircle } from 'lucide-react';
import type { FormFieldDefinition, FieldType } from '@support-hub/shared-types';

interface FieldBuilderProps {
  fields: FormFieldDefinition[];
  onChange: (fields: FormFieldDefinition[]) => void;
}

const FIELD_TYPES: { type: FieldType; label: string }[] = [
  { type: 'text', label: 'Single-line Text' },
  { type: 'email', label: 'Email Address' },
  { type: 'textarea', label: 'Multi-line Textarea' },
  { type: 'dropdown', label: 'Dropdown Select' },
  { type: 'file', label: 'File / Screenshot Upload' },
  { type: 'checkbox', label: 'Checkbox' },
  { type: 'radio', label: 'Radio Buttons' },
];

export const FieldBuilder: React.FC<FieldBuilderProps> = ({ fields, onChange }) => {
  const handleAddField = () => {
    const newId = `field_${Date.now().toString(36)}`;
    const newField: FormFieldDefinition = {
      id: newId,
      label: 'New Question',
      type: 'text',
      required: false,
      order: fields.length,
      placeholder: '',
    };
    onChange([...fields, newField]);
  };

  const handleUpdateField = (index: number, updates: Partial<FormFieldDefinition>) => {
    const updated = [...fields];
    updated[index] = { ...updated[index], ...updates };
    onChange(updated);
  };

  const handleDeleteField = (index: number) => {
    const updated = fields.filter((_, i) => i !== index).map((f, i) => ({ ...f, order: i }));
    onChange(updated);
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= fields.length) return;

    const updated = [...fields];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    // Normalize orders
    const normalized = updated.map((f, i) => ({ ...f, order: i }));
    onChange(normalized);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-text-primary">Form Fields Catalog</h3>
          <p className="text-xs text-text-secondary">
            Configure the input fields rendered dynamically inside the embedded widget form.
          </p>
        </div>
        <button
          type="button"
          onClick={handleAddField}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-md transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Field
        </button>
      </div>

      <div className="space-y-3">
        {fields.map((field, index) => {
          const hasOptions = field.type === 'dropdown' || field.type === 'radio';

          return (
            <div
              key={field.id || index}
              className="p-4 bg-surface-0 border border-border rounded-lg shadow-xs space-y-3 transition-all hover:border-border-strong"
            >
              <div className="flex items-center justify-between gap-3">
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
                    disabled={index === fields.length - 1}
                    onClick={() => handleMove(index, 'down')}
                    className="p-1 hover:text-text-primary disabled:opacity-30 cursor-pointer"
                    title="Move Down"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                </div>

                {/* Field Label */}
                <div className="flex-1">
                  <input
                    type="text"
                    value={field.label}
                    onChange={(e) => handleUpdateField(index, { label: e.target.value })}
                    placeholder="Field Label (e.g. Issue Description)"
                    className="w-full text-sm font-medium px-2.5 py-1.5 bg-surface-1 border border-border rounded-md text-text-primary focus:bg-surface-0"
                  />
                </div>

                {/* Field Type */}
                <div className="w-48">
                  <select
                    value={field.type}
                    onChange={(e) => {
                      const newType = e.target.value as FieldType;
                      handleUpdateField(index, {
                        type: newType,
                        options: (newType === 'dropdown' || newType === 'radio') && (!field.options || field.options.length === 0)
                          ? ['Option 1', 'Option 2']
                          : field.options,
                      });
                    }}
                    className="w-full text-xs px-2.5 py-1.5 bg-surface-1 border border-border rounded-md text-text-primary"
                  >
                    {FIELD_TYPES.map((t) => (
                      <option key={t.type} value={t.type}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Required Toggle */}
                <label className="flex items-center gap-1.5 text-xs text-text-secondary cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={field.required}
                    onChange={(e) => handleUpdateField(index, { required: e.target.checked })}
                    className="rounded border-border text-brand-600 focus:ring-brand-500"
                  />
                  Required
                </label>

                {/* Delete Button */}
                <button
                  type="button"
                  onClick={() => handleDeleteField(index)}
                  className="p-1 text-text-muted hover:text-danger-600 rounded cursor-pointer transition-colors"
                  title="Remove Field"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Sub-inputs: Slug, Placeholder, Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
                <div>
                  <span className="text-text-muted flex items-center gap-1 mb-1" title="Used in API payloads and email templates as {{field.<id>}}">
                    Internal Field Key (Slug)
                    <HelpCircle className="w-3 h-3" />
                  </span>
                  <input
                    type="text"
                    value={field.id}
                    onChange={(e) =>
                      handleUpdateField(index, {
                        id: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '_'),
                      })
                    }
                    className="w-full font-mono text-xs px-2.5 py-1 bg-surface-1 border border-border rounded text-text-secondary"
                  />
                </div>

                <div>
                  <span className="text-text-muted block mb-1">Placeholder text</span>
                  <input
                    type="text"
                    value={field.placeholder || ''}
                    onChange={(e) => handleUpdateField(index, { placeholder: e.target.value })}
                    placeholder="e.g. Explain what happened..."
                    className="w-full text-xs px-2.5 py-1 bg-surface-1 border border-border rounded text-text-secondary"
                  />
                </div>
              </div>

              {/* Options Editor for Dropdown / Radio */}
              {hasOptions && (
                <div className="pt-2 border-t border-border/50">
                  <label className="block text-xs font-medium text-text-secondary mb-1">
                    Selectable Options (comma-separated):
                  </label>
                  <input
                    type="text"
                    value={(field.options || []).join(', ')}
                    onChange={(e) =>
                      handleUpdateField(index, {
                        options: e.target.value
                          .split(',')
                          .map((s) => s.trim())
                          .filter(Boolean),
                      })
                    }
                    placeholder="e.g. Bug, Feature Request, Billing Inquiry"
                    className="w-full text-xs px-2.5 py-1.5 bg-surface-1 border border-border rounded text-text-primary"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
