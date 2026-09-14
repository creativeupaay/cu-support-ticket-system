import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/api';
import { useAuth } from './AuthContext';
import type { Project } from '@support-hub/shared-types';

interface ProjectContextType {
  projects: Project[];
  currentProject: Project | null;
  setCurrentProject: (p: Project) => void;
  isLoading: boolean;
  refetchProjects: () => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(() =>
    localStorage.getItem('selectedProjectId')
  );

  const {
    data: projects = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['projects', user?.id],
    queryFn: async () => {
      const res = await apiClient<{ data: Project[] }>('/projects');
      return res.data;
    },
    enabled: !!user,
  });

  // Select project automatically if none selected or if selected was deleted
  useEffect(() => {
    if (projects.length > 0) {
      if (!selectedProjectId || !projects.some((p) => p._id === selectedProjectId)) {
        const first = projects[0];
        setSelectedProjectId(first._id);
        localStorage.setItem('selectedProjectId', first._id);
      }
    }
  }, [projects, selectedProjectId]);

  const currentProject = projects.find((p) => p._id === selectedProjectId) || (projects.length > 0 ? projects[0] : null);

  const handleSetCurrentProject = (project: Project) => {
    setSelectedProjectId(project._id);
    localStorage.setItem('selectedProjectId', project._id);
  };

  return (
    <ProjectContext.Provider
      value={{
        projects,
        currentProject,
        setCurrentProject: handleSetCurrentProject,
        isLoading,
        refetchProjects: refetch,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

export function useProject() {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
}
