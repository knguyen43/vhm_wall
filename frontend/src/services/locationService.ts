import { apiGet, apiSend } from './apiClient';

export interface Location {
  id: string;
  name: string;
  city?: string;
  country: string;
}

export const listLocations = async (): Promise<Location[]> => {
  return apiGet<Location[]>('/locations');
};

export const createLocation = async (payload: { name: string; city?: string; country: string }): Promise<Location> => {
  return apiSend<Location>('/locations', 'POST', payload);
};
