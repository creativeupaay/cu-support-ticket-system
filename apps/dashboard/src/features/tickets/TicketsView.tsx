import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Inbox, RefreshCw, AlertCircle } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { apiClient } from '../../lib/api';
import { TicketFilters } from './TicketFilters';
import { TicketTable } from './TicketTable';
import { TicketDetailView } from './TicketDetailView';
import { EmptyState } from '../../components/common/EmptyState';
import { ProjectCreateModal } from '../projects/ProjectCreateModal';
import type { Ticket } from '@support-hub/shared-types';

export const TicketsView: React.FC = () => {
  const { currentProject, projects } = useProject();

  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);

  // Fetch tickets for current project
  const {
    data,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: ['tickets', currentProject?._id, selectedStage, search],
    queryFn: async () => {
      if (!currentProject) return { data: [], meta: {} };
      const res = await apiClient<{ data: Ticket[]; meta: any }>(
        `/projects/${currentProject._id}/tickets`,
        {
          params: {
            stageId: selectedStage !== 'all' ? selectedStage : undefined,
            search: search.trim() || undefined,
          },
        }
      );
      return res;
    },
    enabled: !!currentProject,
    refetchInterval: 15000, // Background refresh
  });

  const tickets = data?.data || [];

  // If a ticket is selected, keep its reference fresh when tickets update
  React.useEffect(() => {
    if (selectedTicket && tickets.length > 0) {
      const refreshed = tickets.find((t) => t._id === selectedTicket._id);
      if (refreshed) setSelectedTicket(refreshed);
    }
  }, [tickets, selectedTicket]);

  if (projects.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <EmptyState
          icon={Inbox}
          title="No Projects Yet"
          description="Create your first project to configure custom intake form fields and start collecting support tickets."
          actionLabel="Create Project"
          onAction={() => setIsCreateProjectOpen(true)}
        />
        {isCreateProjectOpen && (
          <ProjectCreateModal onClose={() => setIsCreateProjectOpen(false)} />
        )}
      </div>
    );
  }

  if (!currentProject) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <EmptyState
          icon={Inbox}
          title="Select a Project"
          description="Please select a project from the top navigation bar to view its tickets."
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-text-primary tracking-tight">
            {currentProject.name}
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Real-time multi-stage support pipeline & ticket responses.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface-0 hover:bg-surface-2 border border-border text-xs font-medium text-text-secondary rounded-md transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh tickets"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin text-brand-600' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters: Stage Pills & Search */}
      <TicketFilters
        stages={currentProject.stages || []}
        selectedStage={selectedStage}
        onSelectStage={setSelectedStage}
        search={search}
        onSearchChange={setSearch}
      />

      {/* Main Content Layout: Table & Detail Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className={selectedTicket ? 'lg:col-span-7' : 'lg:col-span-12'}>
          {isLoading ? (
            <div className="bg-surface-0 border border-border rounded-lg p-12 text-center text-xs text-text-muted">
              Loading tickets...
            </div>
          ) : error ? (
            <div className="p-4 rounded-lg bg-danger-50 border border-danger-600/20 text-danger-600 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Failed to load tickets: {(error as any).message}
            </div>
          ) : tickets.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="No Tickets Found"
              description={
                search || selectedStage !== 'all'
                  ? 'No tickets match your active filter or search query.'
                  : 'No tickets have been submitted to this project yet. Use the widget embed snippet on your client site to start collecting tickets.'
              }
            />
          ) : (
            <TicketTable
              tickets={tickets}
              stages={currentProject.stages || []}
              onSelectTicket={(t) => setSelectedTicket(t)}
              selectedTicketId={selectedTicket?._id}
            />
          )}
        </div>

        {/* Ticket Detail Drawer */}
        {selectedTicket && (
          <div className="lg:col-span-5 sticky top-20">
            <TicketDetailView
              ticket={selectedTicket}
              stages={currentProject.stages || []}
              formFields={currentProject.formFields || []}
              onClose={() => setSelectedTicket(null)}
            />
          </div>
        )}
      </div>
    </div>
  );
};
