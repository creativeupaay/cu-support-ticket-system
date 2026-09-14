import React from 'react';
import { StageBadge } from '../../components/common/StageBadge';
import type { Ticket, StageDefinition } from '@support-hub/shared-types';

interface TicketTableProps {
  tickets: Ticket[];
  stages: StageDefinition[];
  onSelectTicket: (ticket: Ticket) => void;
  selectedTicketId?: string;
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function getSummarySnippet(formResponses: Record<string, string | string[]>): string {
  if (!formResponses) return 'No content';
  // Check common summary keys
  const keys = ['description', 'message', 'subject', 'issue_type', 'summary', 'name'];
  for (const k of keys) {
    if (formResponses[k]) {
      const val = formResponses[k];
      return Array.isArray(val) ? val.join(', ') : String(val);
    }
  }
  const firstVal = Object.values(formResponses)[0];
  return firstVal ? String(firstVal) : 'No description provided';
}

export const TicketTable: React.FC<TicketTableProps> = ({
  tickets,
  stages,
  onSelectTicket,
  selectedTicketId,
}) => {
  const stageMap = React.useMemo(() => {
    return new Map(stages.map((s) => [s.id, s]));
  }, [stages]);

  return (
    <div className="bg-surface-0 border border-border rounded-xl shadow-2xs overflow-hidden">
      <div className="overflow-x-auto max-h-[calc(100vh-280px)]">
        <table className="w-full text-left border-collapse">
          {/* Sticky Header */}
          <thead className="sticky top-0 bg-surface-1/90 backdrop-blur-xs border-b border-border z-10">
            <tr className="text-3xs font-bold uppercase tracking-wider text-text-muted">
              <th className="py-3 px-4 w-32">Ticket #</th>
              <th className="py-3 px-4">Subject / Message Summary</th>
              <th className="py-3 px-4 w-52">Requester Email</th>
              <th className="py-3 px-4 w-36">Stage</th>
              <th className="py-3 px-4 w-28 text-right">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-sm">
            {tickets.map((ticket) => {
              const stage = stageMap.get(ticket.currentStageId) || {
                name: ticket.currentStageId,
                color: '#6B7280',
              };
              const isSelected = selectedTicketId === ticket._id;

              return (
                <tr
                  key={ticket._id}
                  onClick={() => onSelectTicket(ticket)}
                  className={`group hover:bg-brand-50/40 cursor-pointer transition-colors ${
                    isSelected ? 'bg-brand-50/60 font-medium' : ''
                  }`}
                >
                  {/* Ticket Number */}
                  <td className="py-3.5 px-4 font-mono text-xs font-semibold text-brand-600">
                    {ticket.ticketNumber}
                  </td>

                  {/* Subject Summary */}
                  <td className="py-3.5 px-4 max-w-md">
                    <div className="truncate text-text-primary text-xs font-medium">
                      {getSummarySnippet(ticket.formResponses)}
                    </div>
                  </td>

                  {/* Requester */}
                  <td className="py-3.5 px-4 text-xs text-text-secondary truncate">
                    {ticket.requesterEmail}
                  </td>

                  {/* Stage Badge */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <StageBadge name={stage.name} color={stage.color} />
                  </td>

                  {/* Updated At */}
                  <td className="py-3.5 px-4 text-xs text-text-muted text-right whitespace-nowrap">
                    {formatRelativeTime(ticket.updatedAt || ticket.createdAt)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
