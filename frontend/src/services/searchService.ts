import { apiGetWithMeta } from './apiClient';
import { Person } from './personService';

export interface SearchResponse {
  persons: Person[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null;
}

export const searchPersons = async (filters: {
  name?: string;
  deathMonth?: number;
  deathYear?: number;
  page?: number;
  limit?: number;
}): Promise<SearchResponse> => {
  const queryParts: string[] = [];
  if (filters.name) {
    queryParts.push(`q=${encodeURIComponent(filters.name.trim())}`);
  }
  if (filters.deathMonth) {
    queryParts.push(`deathMonth=${filters.deathMonth}`);
  }
  if (filters.deathYear) {
    queryParts.push(`deathYear=${filters.deathYear}`);
  }
  queryParts.push(`page=${filters.page || 1}`);
  queryParts.push(`limit=${filters.limit || 20}`);

  const path = `/search/persons?${queryParts.join('&')}`;
  const result = await apiGetWithMeta<Person[]>(path);
  return {
    persons: result.data,
    pagination: result.pagination || null
  };
};
