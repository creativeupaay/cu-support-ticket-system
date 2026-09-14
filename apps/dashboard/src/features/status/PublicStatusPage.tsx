import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Clock, FileText, Paperclip, AlertCircle, CheckCircle } from 'lucide-react';
import { StageBadge } from '../../components/common/StageBadge';
import { apiClient } from '../../lib/api';

interface PublicStatusData {
  ticketNumber: string;
  projectName: string;
  createdAt: string;
  updatedAt: string;
  currentStage: {
    id: string;
    name: string;
    color: string;
    isTerminal: boolean;
  };
  stageHistory: {
    stageId: string;
    stageName: string;
    color: string;
    changedAt: string;
  }[];
  formResponses: Record<string, string | string[]>;
  formFields: {
    id: string;
    label: string;
    type: string;
  }[];
}

export const PublicStatusPage: React.FC = () => {
  const { statusToken } = useParams<{ statusToken: string }>();

  const { data, isLoading, error } = useQuery<PublicStatusData>({
    queryKey: ['publicStatus', statusToken],
    queryFn: async () => {
      const res = await apiClient<{ success: boolean; data: PublicStatusData }>(
        `/public/v1/status/${statusToken}`
      );
      return res.data;
    },
    enabled: !!statusToken,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-1 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-text-secondary">Retrieving ticket status...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-surface-1 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-surface-0 border border-border rounded-xl p-8 text-center shadow-xs">
          <div className="w-12 h-12 rounded-full bg-danger-50 flex items-center justify-center text-danger-600 mx-auto mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-base font-semibold text-text-primary mb-2">Ticket Not Found</h2>
          <p className="text-xs text-text-secondary">
            This ticket link may have expired, or the status token is invalid. Please check the link from your confirmation email.
          </p>
        </div>
      </div>
    );
  }

  const fieldLabelMap = new Map(data.formFields.map((f) => [f.id, f.label]));

  return (
    <div className="min-h-screen bg-surface-1 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Top Branding */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-0 border border-border text-xs text-text-secondary font-medium shadow-xs">
            <span>Support Ticket for</span>
            <strong className="text-text-primary">{data.projectName}</strong>
          </div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">
            Ticket #{data.ticketNumber}
          </h1>
          <p className="text-xs text-text-muted">
            Submitted on {new Date(data.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}
          </p>
        </div>

        {/* Current Stage Card */}
        <div className="bg-surface-0 border border-border rounded-xl p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="text-2xs font-semibold uppercase tracking-wider text-text-muted mb-1">
              Current Status
            </div>
            <div className="flex items-center gap-2">
              <StageBadge name={data.currentStage.name} color={data.currentStage.color} className="text-sm px-3 py-1" />
              {data.currentStage.isTerminal && (
                <span className="inline-flex items-center gap-1 text-xs text-success-600 font-medium">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Resolved
                </span>
              )}
            </div>
          </div>

          <div className="text-left sm:text-right text-xs text-text-secondary">
            <span>Last updated: </span>
            <strong className="text-text-primary">
              {new Date(data.updatedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
            </strong>
          </div>
        </div>

        {/* Status Timeline Card */}
        <div className="bg-surface-0 border border-border rounded-xl p-6 shadow-xs space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-text-primary flex items-center gap-2">
            <Clock className="w-4 h-4 text-brand-600" />
            Stage History Timeline
          </h2>

          <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
            {data.stageHistory.map((item, idx) => (
              <div key={idx} className="relative">
                <div
                  className="absolute -left-6 top-1 w-3 h-3 rounded-full ring-4 ring-surface-0"
                  style={{ backgroundColor: item.color }}
                />
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                  <span className="font-semibold text-text-primary text-sm">
                    {item.stageName}
                  </span>
                  <span className="text-text-muted text-2xs">
                    {new Date(item.changedAt).toLocaleString(undefined, {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submitted Ticket Info (Read-Only) */}
        <div className="bg-surface-0 border border-border rounded-xl p-6 shadow-xs space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-text-primary flex items-center gap-2">
            <FileText className="w-4 h-4 text-brand-600" />
            Your Submitted Information
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {Object.entries(data.formResponses || {}).map(([key, value]) => {
              const label = fieldLabelMap.get(key) || key.replace(/_/g, ' ');
              const isUrl = typeof value === 'string' && value.startsWith('http');

              return (
                <div key={key} className={typeof value === 'string' && value.length > 60 ? 'sm:col-span-2' : ''}>
                  <div className="text-2xs font-semibold uppercase tracking-wider text-text-muted mb-1">
                    {label}
                  </div>

                  {isUrl ? (
                    <a
                      href={value as string}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 p-2.5 bg-surface-1 border border-border rounded-md text-brand-600 hover:bg-brand-50 transition-colors"
                    >
                      <Paperclip className="w-4 h-4" />
                      <span className="truncate max-w-xs font-mono">{value as string}</span>
                    </a>
                  ) : (
                    <div className="p-3 bg-surface-1 rounded-md border border-border/60 text-text-primary font-medium leading-relaxed whitespace-pre-wrap">
                      {Array.isArray(value) ? value.join(', ') : String(value)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="text-center text-2xs text-text-muted">
          Powered by SupportHub Centralized Support Network • Real-time status updates
        </div>
      </div>
    </div>
  );
};
