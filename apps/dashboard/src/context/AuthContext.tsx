import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '../lib/api';

export interface AgentUser {
  id: string;
  organizationId: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'employee' | 'agent';
}

interface AuthContextType {
  user: AgentUser | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: AgentUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AgentUser | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function checkAuth() {
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await apiClient<{ data: { agent: AgentUser } }>('/auth/me');
        setUser(res.data.agent);
      } catch (err) {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    checkAuth();
  }, [token]);

  const login = (newToken: string, newUser: AgentUser) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('selectedProjectId');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
