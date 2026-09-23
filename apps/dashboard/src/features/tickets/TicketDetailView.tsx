import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  X,
  ExternalLink,
  Send,
  Clock,
  MessageSquare,
  FileText,
  Paperclip,
} from 'lucide-react';
import { StageBadge } from '../../components/common/StageBadge';
import { apiClient, getApiUrl } from '../../lib/api';
import type { Ticket, StageDefinition, FormFieldDefinition } from '@support-hub/shared-types';

interface TicketDetailViewProps {
  ticket: Ticket;
  stages: StageDefinition[];
  formFields?: FormFieldDefinition[];
  onClose: () => void;
}

export const TicketDetailView: React.FC<TicketDetailViewProps> = ({
  ticket,
  stages,
  formFields = [],
  onClose,
}) => {
  const queryClient = useQueryClient();
  const [newNote, setNewNote] = useState('');

  // Find current stage
  const currentStage = stages.find((s) => s.id === ticket.currentStageId) || {
    name: ticket.currentStageId,
    color: '#6B7280',
  };

  // Stage change mutation
  const stageMutation = useMutation({
    mutationFn: async (newStageId: string) => {
      const res = await apiClient(`/tickets/${ticket._id}/stage`, {
        method: 'PATCH',
        body: JSON.stringify({ stageId: newStageId }),
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
  });

  // Note addition mutation
  const noteMutation = useMutation({
    mutationFn: async (body: string) => {
      const res = await apiClient(`/tickets/${ticket._id}/notes`, {
        method: 'POST',
        body: JSON.stringify({ body }),
      });
      return res.data;
    },
    onSuccess: () => {
      setNewNote('');
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
  });

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    noteMutation.mutate(newNote.trim());
  };

  // Map field definitions to display labels
  const fieldMap = React.useMemo(() => {
    return new Map(formFields.map((f) => [f.id, f]));
  }, [formFields]);


  return (
    <div className="bg-surface-0 border border-border rounded-xl shadow-lg flex flex-col h-full max-h-[calc(100vh-140px)] overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-border bg-surface-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-mono text-base font-bold text-brand-600">
              {ticket.ticketNumber}
            </h2>
            <StageBadge name={currentStage.name} color={currentStage.color} />
          </div>
          <div className="flex items-center gap-3 text-xs text-text-secondary mt-1">
            <span>From: <strong className="text-text-primary">{ticket.requesterEmail}</strong></span>
            <span>•</span>
            <span>Created: {new Date(ticket.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Public Status Page Button */}
          <a
            href={`/status/${ticket.statusToken}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-surface-0 border border-border text-xs font-medium text-text-secondary hover:text-brand-600 hover:bg-surface-2 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            End-user Status Page
          </a>

          {/* Close Panel */}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-text-muted hover:text-text-primary rounded-md cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {/* Inline Stage Dropdown Action */}
        <div className="p-4 rounded-lg bg-surface-1 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs">
            <span className="font-semibold text-text-primary block">Current Stage Lifecycle:</span>
            <span className="text-text-secondary">
              Changing stage automatically triggers the configured Resend email template.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-text-secondary">Move to:</label>
            <select
              value={ticket.currentStageId}
              disabled={stageMutation.isPending}
              onChange={(e) => stageMutation.mutate(e.target.value)}
              className="text-xs font-medium px-3 py-1.5 bg-surface-0 border border-border rounded-md text-text-primary focus:ring-brand-500 shadow-xs cursor-pointer disabled:opacity-50"
            >
              {stages.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.isTerminal ? '(Terminal)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Submitted Form Responses */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-brand-600" />
            Submitted Ticket Information
          </h3>

          <div className="bg-surface-1 border border-border rounded-lg p-4 grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
            {Object.entries(ticket.formResponses || {}).map(([key, value]) => {
              const def = fieldMap.get(key);
              const label = def?.label || key.replace(/_/g, ' ');
              const strVal = Array.isArray(value) ? value.join(', ') : String(value || '');
              
              const isFile =
                def?.type === 'file' ||
                strVal.startsWith('http://') ||
                strVal.startsWith('https://') ||
                strVal.includes('/attachments/') ||
                strVal.includes('/uploads/') ||
                strVal.includes('cloudinary');

              const isImage =
                isFile &&
                (/\.(png|jpg|jpeg|webp|gif|svg|bmp)(\?.*)?$/i.test(strVal) ||
                  strVal.includes('cloudinary') ||
                  strVal.includes('unsplash') ||
                  strVal.includes('/attachments/'));

              const resolvedFileUrl = isFile
                ? strVal.startsWith('http')
                  ? strVal
                  : getApiUrl(strVal)
                : '';

              const isFullWidth = isFile || def?.type === 'textarea' || strVal.length > 50;

              return (
                <div
                  key={key}
                  className={`min-w-0 overflow-hidden space-y-1 ${
                    isFullWidth ? 'sm:col-span-2 col-span-full' : ''
                  }`}
                >
                  <div className="font-semibold text-text-muted text-2xs uppercase tracking-wider">
                    {label}
                  </div>

                  {isFile ? (
                    <div className="rounded-lg border border-border bg-surface-0 p-3 space-y-2.5 overflow-hidden shadow-2xs">
                      {isImage ? (
                        <div className="space-y-2">
                          <div className="relative group rounded-lg overflow-hidden bg-surface-2 border border-border/80 flex items-center justify-center max-h-60">
                            <img
                              src={resolvedFileUrl}
                              alt={label}
                              className="w-full max-h-56 object-contain rounded-lg transition-transform duration-200 group-hover:scale-[1.01]"
                              onError={(e) => {
                                // Fallback icon on broken image
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                            <a
                              href={resolvedFileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white text-xs font-semibold backdrop-blur-2xs"
                            >
                              <ExternalLink className="w-4 h-4" />
                              <span>View Full Size</span>
                            </a>
                          </div>

                          <div className="flex items-center justify-between gap-2 pt-1">
                            <span className="text-2xs font-mono text-text-secondary truncate max-w-[200px]" title={strVal}>
                              {strVal.split('/').pop() || 'Attachment image'}
                            </span>
                            <a
                              href={resolvedFileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-surface-1 hover:bg-surface-2 border border-border rounded text-2xs font-medium text-brand-700 transition-colors"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>Open in new tab</span>
                            </a>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <Paperclip className="w-4 h-4 text-brand-600 shrink-0" />
                            <span className="truncate font-mono text-xs text-text-primary" title={strVal}>
                              {strVal.split('/').pop() || strVal}
                            </span>
                          </div>
                          <a
                            href={resolvedFileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-surface-1 hover:bg-surface-2 border border-border rounded text-2xs font-medium text-brand-700 transition-colors shrink-0"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Download / View</span>
                          </a>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-text-primary font-medium bg-surface-0 p-2.5 rounded-lg border border-border/80 whitespace-pre-wrap leading-relaxed break-words shadow-2xs">
                      {strVal || '—'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Stage Timeline */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-brand-600" />
            Stage History Timeline
          </h3>

          <div className="bg-surface-1 border border-border rounded-lg p-4">
            <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
              {ticket.stageHistory.map((history, idx) => {
                const stageObj = stages.find((s) => s.id === history.stageId);
                const color = stageObj?.color || '#3B82F6';

                return (
                  <div key={idx} className="relative">
                    <div
                      className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full ring-4 ring-surface-1"
                      style={{ backgroundColor: color }}
                    />
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-text-primary">
                        {history.stageName || stageObj?.name || history.stageId}
                      </span>
                      <span className="text-text-muted text-2xs">
                        {new Date(history.changedAt).toLocaleString()}
                      </span>
                    </div>
                    {history.changedBy && (
                      <div className="text-2xs text-text-secondary mt-0.5">
                        Changed by: {history.changedBy}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Internal Notes Thread (Agent Only) */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-brand-600" />
            Internal Agent Notes (Private — Not Emailed)
          </h3>

          <div className="space-y-2">
            {ticket.internalNotes && ticket.internalNotes.length > 0 ? (
              ticket.internalNotes.map((note, idx) => (
                <div key={idx} className="p-3 bg-surface-1 border border-border rounded-lg text-xs space-y-1">
                  <div className="flex items-center justify-between text-2xs text-text-muted">
                    <span className="font-medium text-text-primary">{note.authorName || 'Agent'}</span>
                    <span>{new Date(note.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="text-text-secondary leading-relaxed">{note.body}</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-text-muted italic bg-surface-1 p-3 rounded-lg border border-border">
                No internal notes recorded on this ticket yet.
              </p>
            )}

            {/* Add note input */}
            <form onSubmit={handleAddNote} className="mt-3 flex gap-2">
              <input
                type="text"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add a private agent note..."
                className="flex-1 text-xs px-3 py-2 bg-surface-0 border border-border rounded-md text-text-primary focus:bg-surface-0 shadow-xs"
              />
              <button
                type="submit"
                disabled={noteMutation.isPending || !newNote.trim()}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-md transition-colors cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                Add Note
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
