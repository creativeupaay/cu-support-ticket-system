import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, ArrowRight } from 'lucide-react';
import { apiClient } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

export const LoginView: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await apiClient<{ data: { token: string; agent: any } }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      login(res.data.token, res.data.agent);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-1 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brand-600 text-white font-bold text-xl shadow-md">
          SH
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-text-primary">
          SupportHub Agent Portal
        </h2>
        <p className="text-xs text-text-secondary">
          Centralized ticket management across all client applications
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-surface-0 py-8 px-6 sm:px-10 border border-border rounded-xl shadow-sm space-y-6">
          {error && (
            <div className="p-3 bg-danger-50 border border-danger-600/30 text-danger-600 text-xs font-medium rounded-md">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">
                Agent Email or Username
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="creativeupaay.com or agent@supporthub.com"
                  className="w-full text-xs pl-9 pr-3 py-2 bg-surface-1 border border-border rounded-md text-text-primary focus:bg-surface-0"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-xs pl-9 pr-3 py-2 bg-surface-1 border border-border rounded-md text-text-primary focus:bg-surface-0"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-md text-xs font-medium text-white bg-brand-600 hover:bg-brand-700 active:bg-brand-800 shadow-sm transition-colors cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Signing in...' : 'Sign in to Dashboard'}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
