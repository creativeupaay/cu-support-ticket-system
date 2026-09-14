const API_BASE = '/api';

export interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | undefined>;
}

export async function apiClient<T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const token = localStorage.getItem('token');
  const headers = new Headers(options.headers || {});

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  let url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  if (options.params) {
    const searchParams = new URLSearchParams();
    for (const [k, v] of Object.entries(options.params)) {
      if (v !== undefined && v !== '') {
        searchParams.append(k, String(v));
      }
    }
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString;
    }
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data?.error?.message || response.statusText || 'An error occurred';
    const err = new Error(errorMsg) as any;
    err.status = response.status;
    err.code = data?.error?.code;
    err.details = data?.error?.details;
    throw err;
  }

  return data;
}
