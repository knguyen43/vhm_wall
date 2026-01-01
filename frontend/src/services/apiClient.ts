const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export interface ApiError {
  code: string;
  message: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const getAuthHeader = (): HeadersInit => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const apiGet = async <T>(path: string): Promise<T> => {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader()
    }
  });
  const body = (await res.json()) as ApiResponse<T>;
  if (!res.ok || !body.success) {
    throw new Error(body.error?.message || 'Request failed');
  }
  return body.data as T;
};

export const apiGetWithMeta = async <T>(path: string): Promise<{ data: T; pagination?: ApiResponse<T>['pagination'] }> => {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader()
    }
  });
  const body = (await res.json()) as ApiResponse<T>;
  if (!res.ok || !body.success) {
    throw new Error(body.error?.message || 'Request failed');
  }
  return { data: body.data as T, pagination: body.pagination };
};

export const apiSend = async <T>(path: string, method: 'POST' | 'PUT' | 'DELETE', payload?: unknown): Promise<T> => {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader()
    },
    body: payload ? JSON.stringify(payload) : undefined
  });
  const body = (await res.json()) as ApiResponse<T>;
  if (!res.ok || !body.success) {
    throw new Error(body.error?.message || 'Request failed');
  }
  return body.data as T;
};
