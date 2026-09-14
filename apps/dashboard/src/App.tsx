import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProjectProvider } from './context/ProjectContext';
import { Sidebar } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { ProjectsOverview } from './features/projects/ProjectsOverview';
import { TicketsView } from './features/tickets/TicketsView';
import { ProjectSettingsView } from './features/projects/ProjectSettingsView';
import { PublicStatusPage } from './features/status/PublicStatusPage';
import { LoginView } from './features/auth/LoginView';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const ProtectedLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = React.useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-1 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <ProjectProvider>
      <div className="min-h-screen bg-surface-1 flex">
        <Sidebar
          isOpen={isMobileSidebarOpen}
          onClose={() => setIsMobileSidebarOpen(false)}
        />
        <div className="flex-1 flex flex-col min-w-0">
          <TopBar onToggleSidebar={() => setIsMobileSidebarOpen(true)} />
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
    </ProjectProvider>
  );
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public End-user Status Page (No login required) */}
            <Route path="/status/:statusToken" element={<PublicStatusPage />} />

            {/* Agent Login */}
            <Route path="/login" element={<LoginView />} />

            {/* Protected Agent Portal */}
            <Route
              path="/"
              element={
                <ProtectedLayout>
                  <ProjectsOverview />
                </ProtectedLayout>
              }
            />
            <Route
              path="/tickets"
              element={
                <ProtectedLayout>
                  <TicketsView />
                </ProtectedLayout>
              }
            />
            <Route
              path="/projects/settings"
              element={
                <ProtectedLayout>
                  <ProjectSettingsView />
                </ProtectedLayout>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};
