import { apiGet, apiSend } from './apiClient';

export interface FamilyRelationship {
  id: string;
  relationshipType: string;
  person: { id: string; firstName: string; lastName: string };
  relatedPerson: { id: string; firstName: string; lastName: string };
}

export const listFamily = async (personId: string): Promise<FamilyRelationship[]> => {
  return apiGet<FamilyRelationship[]>(`/family/${personId}`);
};

export const addFamily = async (
  personId: string,
  payload: { relatedPersonId: string; relationshipType: string }
): Promise<FamilyRelationship> => {
  return apiSend<FamilyRelationship>(`/family/${personId}`, 'POST', payload);
};
