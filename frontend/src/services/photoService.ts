import { apiGet } from './apiClient';

export interface Photo {
  id: string;
  url: string;
  thumbnailUrl?: string;
  caption?: string;
  isPrimary: boolean;
  createdAt: string;
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export const uploadPhoto = async (
  personId: string,
  file: File,
  options?: { caption?: string; isPrimary?: boolean }
): Promise<Photo> => {
  const formData = new FormData();
  formData.append('photo', file);
  if (options?.caption) formData.append('caption', options.caption);
  if (options?.isPrimary !== undefined) {
    formData.append('isPrimary', String(options.isPrimary));
  }

  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE}/photos/${personId}`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: formData
  });
  const body = await res.json();
  if (!res.ok || !body.success) {
    throw new Error(body.error?.message || 'Upload failed');
  }
  return body.data as Photo;
};

export const listPhotos = async (personId: string): Promise<Photo[]> => {
  return apiGet<Photo[]>(`/photos/${personId}`);
};

export const setPrimaryPhoto = async (photoId: string): Promise<Photo> => {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE}/photos/${photoId}/primary`, {
    method: 'PUT',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined
  });
  const body = await res.json();
  if (!res.ok || !body.success) {
    throw new Error(body.error?.message || 'Update failed');
  }
  return body.data as Photo;
};

export const resolvePhotoUrl = (url: string): string => {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  const base = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1').replace('/api/v1', '');
  return `${base}${url}`;
};
