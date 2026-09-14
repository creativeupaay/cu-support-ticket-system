import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Inbox,
  Settings,
  LogOut,
  X,
  Code2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useProject } from '../../context/ProjectContext';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = false, onClose }) => {
  const { user, logout } = useAuth();
  const { currentProject } = useProject();
  const location = useLocation();

  const navLinks = [
    {
      label: 'Dashboard',
      path: '/',
      icon: LayoutDashboard,
      isActive: location.pathname === '/',
    },
    {
      label: 'Tickets',
      path: '/tickets',
      icon: Inbox,
      isActive: location.pathname.startsWith('/tickets'),
    },
    {
      label: 'Settings & Embed',
      path: '/projects/settings',
      icon: Settings,
      isActive: location.pathname.startsWith('/projects/settings'),
    },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 md:hidden transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Main Sidebar Container */}
      <aside
        className={`fixed md:sticky top-0 inset-y-0 left-0 z-50 md:z-20 w-64 bg-surface-0 border-r border-border flex flex-col justify-between transition-transform duration-200 ease-in-out h-screen shrink-0 ${
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Top Section: Brand & Navigation */}
        <div className="flex flex-col flex-1 min-h-0 overflow-y-auto">
          {/* Brand & Mobile Close */}
          <div className="h-14 px-4 border-b border-border flex items-center justify-between shrink-0">
            <Link
              to="/"
              onClick={onClose}
              className="flex items-center gap-2.5 font-bold text-text-primary text-sm tracking-tight group"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-600 to-indigo-700 flex items-center justify-center text-white font-bold text-xs shadow-xs group-hover:scale-105 transition-transform">
                SH
              </div>
              <div className="flex flex-col">
                <span className="leading-tight">SupportHub</span>
                <span className="text-3xs font-medium text-text-muted">Multi-Project Portal</span>
              </div>
            </Link>

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-text-muted hover:text-text-primary rounded-md hover:bg-surface-1 md:hidden transition-colors cursor-pointer"
                title="Close sidebar"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Navigation Items */}
          <div className="p-3 space-y-6">
            <div>
              <div className="px-2 mb-2 text-3xs font-bold text-text-muted uppercase tracking-wider">
                Main Menu
              </div>
              <nav className="space-y-1">
                {navLinks.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={onClose}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                        item.isActive
                          ? 'bg-brand-50 text-brand-700 font-semibold shadow-2xs ring-1 ring-brand-500/10'
                          : 'text-text-secondary hover:text-text-primary hover:bg-surface-1'
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 ${
                          item.isActive ? 'text-brand-600' : 'text-text-muted'
                        }`}
                      />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Quick Integration Utilities */}
            <div>
              <div className="px-2 mb-2 text-3xs font-bold text-text-muted uppercase tracking-wider">
                Integration & Settings
              </div>
              <div className="space-y-1">
                {currentProject ? (
                  <Link
                    to="/projects/settings"
                    onClick={onClose}
                    className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-text-secondary hover:text-brand-600 hover:bg-surface-1 transition-all group"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Code2 className="w-4 h-4 text-text-muted group-hover:text-brand-600 transition-colors shrink-0" />
                      <span className="truncate">Embed & Fields Studio</span>
                    </div>
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-500 shrink-0" />
                  </Link>
                ) : (
                  <div className="px-3 py-1.5 text-3xs text-text-muted">Select project to configure</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom User Profile & Logout */}
        <div className="p-3 border-t border-border bg-surface-1/40 shrink-0">
          <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-surface-0 border border-border shadow-2xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-100 to-indigo-100 text-brand-700 font-bold text-xs flex items-center justify-center border border-brand-200 shrink-0">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-text-primary truncate">
                  {user?.name || user?.email}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <span
                    className={`text-3xs font-bold uppercase tracking-wider px-1.5 py-0.2 rounded-sm truncate ${
                      user?.role === 'admin' || user?.role === 'owner'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {user?.role === 'admin' || user?.role === 'owner'
                      ? 'Admin'
                      : user?.role === 'employee'
                      ? 'Employee'
                      : user?.role || 'Agent'}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={logout}
              title="Log out"
              className="p-1.5 text-text-muted hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors cursor-pointer shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
