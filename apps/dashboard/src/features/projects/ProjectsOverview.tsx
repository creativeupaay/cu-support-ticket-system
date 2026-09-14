import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layers,
  Inbox,
  Settings,
  Plus,
  Search,
  ExternalLink,
  Activity,
  Ticket,
} from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { ProjectCreateModal } from './ProjectCreateModal';
import type { Project } from '@support-hub/shared-types';

export const ProjectsOverview: React.FC = () => {
  const { projects, setCurrentProject } = useProject();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleOpenTickets = (project: Project) => {
    setCurrentProject(project);
    navigate('/tickets');
  };

  const handleOpenSettings = (project: Project) => {
    setCurrentProject(project);
    navigate('/projects/settings');
  };

  // Filter projects by search query
  const filteredProjects = projects.filter((p) => {
    const q = search.toLowerCase();
    return p.name.toLowerCase().includes(q);
  });

  // Helper to consistently get ticket count
  const getProjectTicketCount = (project: Project) => {
    if (typeof project.ticketCount === 'number') return project.ticketCount;
    if (typeof project.ticketCounter === 'number') return Math.max(0, project.ticketCounter - 1000);
    return 0;
  };

  // Calculate totals
  const totalTickets = projects.reduce((acc, p) => acc + getProjectTicketCount(p), 0);

  // If no projects exist at all, render the clean onboarding zero-state
  if (projects.length === 0) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-surface-0 border border-border rounded-2xl p-8 sm:p-12 shadow-sm text-center relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-72 h-72 rounded-full bg-brand-500/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-72 h-72 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white flex items-center justify-center mx-auto shadow-md shadow-brand-500/20 mb-6">
            <Layers className="w-8 h-8" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
            Welcome to SupportHub
          </h2>
          <p className="text-sm text-text-secondary max-w-lg mx-auto mt-2 leading-relaxed">
            Create your first project to start designing custom intake forms, managing multi-stage ticket workflows, and generating embed code for your web apps.
          </p>

          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white text-sm font-semibold rounded-xl shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Your First Project</span>
            </button>
          </div>

          {/* 3 Step Onboarding Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-12 pt-8 border-t border-border text-left">
            <div className="p-4 rounded-xl bg-surface-1/60 border border-border/80">
              <div className="w-7 h-7 rounded-lg bg-brand-50 text-brand-700 font-bold text-xs flex items-center justify-center mb-3">
                1
              </div>
              <h4 className="text-xs font-bold text-text-primary">Create Workspace</h4>
              <p className="text-2xs text-text-secondary mt-1">
                Configure your project name and allowed domains for origin security.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-surface-1/60 border border-border/80">
              <div className="w-7 h-7 rounded-lg bg-brand-50 text-brand-700 font-bold text-xs flex items-center justify-center mb-3">
                2
              </div>
              <h4 className="text-xs font-bold text-text-primary">Custom Schema & Stages</h4>
              <p className="text-2xs text-text-secondary mt-1">
                Build drag-and-drop form fields with email triggers on ticket status changes.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-surface-1/60 border border-border/80">
              <div className="w-7 h-7 rounded-lg bg-brand-50 text-brand-700 font-bold text-xs flex items-center justify-center mb-3">
                3
              </div>
              <h4 className="text-xs font-bold text-text-primary">Embed Anywhere</h4>
              <p className="text-2xs text-text-secondary mt-1">
                Choose floating widgets, custom buttons, navbar links, or React TSX components.
              </p>
            </div>
          </div>
        </div>

        {isCreateModalOpen && (
          <ProjectCreateModal onClose={() => setIsCreateModalOpen(false)} />
        )}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header & Fast Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">
            Projects & Workspaces
          </h1>
          <p className="text-xs text-text-secondary mt-1">
            Centralized hub for all your support widgets, ticket pipelines, and integration schemas.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </button>
      </div>

      {/* Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl bg-surface-0 border border-border shadow-xs flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center border border-brand-500/15 shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-2xs font-semibold uppercase tracking-wider text-text-muted">
              Total Projects
            </div>
            <div className="text-xl font-bold text-text-primary mt-0.5">
              {projects.length}
            </div>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-surface-0 border border-border shadow-xs flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-500/15 shrink-0">
            <Ticket className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-2xs font-semibold uppercase tracking-wider text-text-muted">
              Total Tickets
            </div>
            <div className="text-xl font-bold text-text-primary mt-0.5">
              {totalTickets}
            </div>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-surface-0 border border-border shadow-xs flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-500/15 shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-2xs font-semibold uppercase tracking-wider text-text-muted">
              System Status
            </div>
            <div className="text-sm font-bold text-emerald-700 mt-0.5 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Operational</span>
            </div>
          </div>
        </div>
      </div>

      {/* Projects Grid Section with Search */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-text-primary">
              All Projects ({filteredProjects.length})
            </h2>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search projects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3.5 py-1.5 bg-surface-0 border border-border rounded-lg text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all shadow-2xs"
            />
          </div>
        </div>

        {filteredProjects.length === 0 ? (
          <div className="p-12 text-center bg-surface-0 border border-border rounded-xl">
            <Search className="w-8 h-8 text-text-muted mx-auto mb-2" />
            <div className="text-sm font-semibold text-text-primary">No matching projects found</div>
            <p className="text-xs text-text-secondary mt-1">
              Try adjusting your search query or create a new project.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredProjects.map((project) => (
              <div
                key={project._id}
                className="bg-surface-0 border border-border hover:border-brand-300 rounded-xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Top: Icon + Name */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-indigo-700 text-white font-bold text-sm flex items-center justify-center shadow-xs shrink-0 group-hover:scale-105 transition-transform">
                      {project.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-bold text-text-primary group-hover:text-brand-600 transition-colors truncate">
                        {project.name}
                      </h3>
                      {(project.creatorName || project.creatorEmail) && (
                        <div className="text-3xs text-text-muted truncate mt-0.5">
                          Created by{' '}
                          <span className="font-semibold text-text-secondary">
                            {project.creatorName || project.creatorEmail}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Tickets Count Box */}
                  <div className="mt-4 p-3 rounded-xl bg-surface-1/70 border border-border/80 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-medium text-text-secondary">
                      <Inbox className="w-4 h-4 text-brand-600" />
                      <span>Tickets</span>
                    </div>
                    <div className="text-sm font-bold text-text-primary">
                      {getProjectTicketCount(project)}
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="mt-5 pt-1 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenTickets(project)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-brand-50 hover:bg-brand-100 text-brand-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    <Inbox className="w-3.5 h-3.5" />
                    <span>Tickets</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenSettings(project)}
                    className="p-2 text-text-secondary hover:text-text-primary hover:bg-surface-2 rounded-lg border border-border transition-colors cursor-pointer"
                    title="Project Settings & Embed"
                  >
                    <Settings className="w-4 h-4" />
                  </button>

                  <a
                    href={`http://localhost:5174?key=${project.projectKey}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 text-text-secondary hover:text-brand-600 hover:bg-surface-2 rounded-lg border border-border transition-colors"
                    title="Preview Widget in new tab"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Project Creation Modal */}
      {isCreateModalOpen && (
        <ProjectCreateModal onClose={() => setIsCreateModalOpen(false)} />
      )}
    </div>
  );
};
