import { apiGetWithMeta, apiSend } from './apiClient';

export interface Person {
  id: string;
  firstName: string;
  lastName: string;
  createdAt?: string;
  dateOfBirth?: string;
  dateOfDeath?: string;
  causeOfDeath?: string;
  placeOfBirth?: Location;
  placeOfDeath?: Location;
  cemetery?: Cemetery;
  photos?: Photo[];
  familyCount?: number;
  memorialActivity?: MemorialActivity;
}

export interface Location {
  id: string;
  name: string;
  city?: string;
  country?: string;
}

export interface Cemetery {
  id: string;
  name: string;
  location?: Location;
}

export interface Photo {
  id?: string;
  url: string;
  thumbnailUrl?: string;
  caption?: string;
  isPrimary?: boolean;
}

export interface MemorialActivity {
  offerings: number;
  remembrances: number;
}

export interface PersonListResponse {
  persons: Person[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null;
}

export const listPersons = async (page = 1, limit = 20): Promise<PersonListResponse> => {
  const result = await apiGetWithMeta<Person[]>(`/persons?page=${page}&limit=${limit}`);
  return {
    persons: result.data,
    pagination: result.pagination || null
  };
};

export const createPerson = async (firstName: string, lastName: string): Promise<Person> => {
  return apiSend<Person>('/persons', 'POST', { firstName, lastName });
};

export const deletePerson = async (id: string): Promise<{ id: string }> => {
  return apiSend<{ id: string }>(`/persons/${id}`, 'DELETE');
};
