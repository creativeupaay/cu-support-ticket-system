import React, { useState, useRef, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  Menu,
  ChevronRight,
  Layers,
  LayoutDashboard,
  Plus,
  ChevronsUpDown,
  Check,
  Search,
  Inbox,
} from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { ProjectCreateModal } from '../../features/projects/ProjectCreateModal';
import type { Project } from '@support-hub/shared-types';

interface TopBarProps {
  onToggleSidebar: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onToggleSidebar }) => {
  const { projects, currentProject, setCurrentProject } = useProject();
  const location = useLocation();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isDashboard = location.pathname === '/';
  const isTickets = location.pathname.startsWith('/tickets');
  const isSettings = location.pathname.startsWith('/projects/settings');

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsDropdownOpen(false);
      }
    }

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDropdownOpen]);

  // Filter projects by search query
  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  const handleSelectProject = (project: Project) => {
    setCurrentProject(project);
    setIsDropdownOpen(false);
    setSearchQuery('');
  };

  return (
    <>
      <header className="sticky top-0 z-20 h-14 bg-surface-0/90 backdrop-blur-md border-b border-border px-4 sm:px-6 flex items-center justify-between shadow-2xs">
        {/* Left: Mobile Toggle & Project Switcher / Breadcrumbs */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="p-1.5 -ml-1 text-text-muted hover:text-text-primary rounded-lg hover:bg-surface-1 md:hidden transition-colors cursor-pointer"
            title="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Breadcrumb Navigation */}
          <nav className="flex items-center gap-1.5 text-xs text-text-muted min-w-0" aria-label="Breadcrumb">
            <Link
              to="/"
              className="flex items-center gap-1.5 font-medium text-text-secondary hover:text-brand-600 transition-colors"
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-text-muted" />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>

            <ChevronRight className="w-3.5 h-3.5 text-border-strong shrink-0" />

            {/* Project Switcher Dropdown in Header */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsDropdownOpen((prev) => !prev)}
                className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-surface-1 hover:bg-surface-2 border border-border text-xs font-semibold text-text-primary transition-all cursor-pointer shadow-2xs group"
                aria-expanded={isDropdownOpen}
                aria-haspopup="true"
                title="Switch active project workspace"
              >
                {currentProject ? (
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-5 h-5 rounded-md bg-gradient-to-br from-brand-600 to-indigo-700 text-white font-bold text-3xs flex items-center justify-center shrink-0">
                      {currentProject.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="truncate max-w-[120px] sm:max-w-[190px] font-bold">
                      {currentProject.name}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-text-secondary">
                    <Layers className="w-3.5 h-3.5" />
                    <span>Select Project</span>
                  </div>
                )}
                <ChevronsUpDown className="w-3.5 h-3.5 text-text-muted group-hover:text-text-primary shrink-0 ml-0.5" />
              </button>

              {/* Dropdown Menu Popover */}
              {isDropdownOpen && (
                <div className="absolute left-0 mt-1.5 w-72 bg-surface-0 border border-border rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in-50 zoom-in-95 duration-100">
                  {/* Dropdown Header & Search */}
                  <div className="p-2.5 border-b border-border bg-surface-1/60 space-y-2">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-3xs font-bold uppercase tracking-wider text-text-muted">
                        Workspaces ({projects.length})
                      </span>
                      <span className="text-3xs text-brand-600 font-semibold">Active Selection</span>
                    </div>

                    {projects.length > 3 && (
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-text-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Filter projects..."
                          autoFocus
                          className="w-full pl-8 pr-2.5 py-1 text-xs bg-surface-0 border border-border rounded-md text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-brand-500"
                        />
                      </div>
                    )}
                  </div>

                  {/* Projects List */}
                  <div className="max-h-60 overflow-y-auto p-1.5 space-y-0.5">
                    {filteredProjects.length === 0 ? (
                      <div className="py-4 text-center text-xs text-text-muted">
                        No projects match "{searchQuery}"
                      </div>
                    ) : (
                      filteredProjects.map((proj) => {
                        const isSelected = currentProject?._id === proj._id;
                        return (
                          <button
                            key={proj._id}
                            type="button"
                            onClick={() => handleSelectProject(proj)}
                            className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-xs transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-brand-50 text-brand-700 font-semibold'
                                : 'text-text-secondary hover:bg-surface-1 hover:text-text-primary'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-brand-500 to-indigo-600 text-white font-bold text-2xs flex items-center justify-center shrink-0">
                                {proj.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <div className="truncate text-xs font-semibold text-text-primary">
                                  {proj.name}
                                </div>
                                <div className="text-3xs text-text-muted font-mono truncate">
                                  {proj.projectKey}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0 ml-2">
                              {typeof proj.ticketCount === 'number' && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-surface-2 text-3xs font-medium text-text-secondary">
                                  <Inbox className="w-2.5 h-2.5" />
                                  {proj.ticketCount}
                                </span>
                              )}
                              {isSelected && (
                                <Check className="w-4 h-4 text-brand-600 shrink-0" />
                              )}
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>

                  {/* Quick Action Footer */}
                  <div className="p-1.5 border-t border-border bg-surface-1/40">
                    <button
                      type="button"
                      onClick={() => {
                        setIsDropdownOpen(false);
                        setIsCreateModalOpen(true);
                      }}
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Create New Project</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Page View Segment */}
            {!isDashboard && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-border-strong shrink-0 hidden sm:inline" />
                <span className="hidden sm:inline font-semibold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-md text-2xs uppercase tracking-wider font-mono border border-brand-500/10">
                  {isSettings ? 'Settings & Embed' : isTickets ? 'Tickets' : 'View'}
                </span>
              </>
            )}
          </nav>
        </div>

        {/* Right: Actions & Live Connection Status */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-500/20 text-3xs font-medium text-emerald-700">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span>Live Connected</span>
          </div>

          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 active:bg-brand-800 rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Project</span>
          </button>
        </div>
      </header>

      {/* Project Creation Modal */}
      {isCreateModalOpen && (
        <ProjectCreateModal onClose={() => setIsCreateModalOpen(false)} />
      )}
    </>
  );
};
