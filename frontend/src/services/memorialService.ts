import { apiGet, apiSend } from './apiClient';

export interface Remembrance {
  id: string;
  message: string;
  authorName?: string;
  createdAt: string;
}

export interface Offering {
  id: string;
  offeringType: 'CANDLE' | 'FLOWER' | 'INCENSE' | 'PRAYER';
  message?: string;
  authorName?: string;
  createdAt: string;
}

export interface Reminder {
  id: string;
  title: string;
  date: string;
  frequency: 'ONCE' | 'YEARLY' | 'MONTHLY';
  active: boolean;
  createdAt: string;
}

export interface OfferingsSummary {
  totalCount: number;
  counts: Record<string, number>;
  recent: Offering[];
}

export const getRemembrances = async (personId: string): Promise<Remembrance[]> => {
  return apiGet<Remembrance[]>(`/memorials/${personId}/remembrances`);
};

export const addRemembrance = async (personId: string, payload: { message: string; authorName?: string }): Promise<Remembrance> => {
  return apiSend<Remembrance>(`/memorials/${personId}/remembrances`, 'POST', payload);
};

export const getOfferings = async (personId: string): Promise<OfferingsSummary> => {
  return apiGet<OfferingsSummary>(`/memorials/${personId}/offerings`);
};

export const addOffering = async (
  personId: string,
  payload: { offeringType: Offering['offeringType']; message?: string; authorName?: string }
): Promise<Offering> => {
  return apiSend<Offering>(`/memorials/${personId}/offerings`, 'POST', payload);
};

export const getReminders = async (personId: string): Promise<Reminder[]> => {
  return apiGet<Reminder[]>(`/memorials/${personId}/reminders`);
};

export const addReminder = async (
  personId: string,
  payload: { title: string; date: string; frequency: Reminder['frequency'] }
): Promise<Reminder> => {
  return apiSend<Reminder>(`/memorials/${personId}/reminders`, 'POST', payload);
};

export const deleteReminder = async (reminderId: string): Promise<{ id: string }> => {
  return apiSend<{ id: string }>(`/memorials/reminders/${reminderId}`, 'DELETE');
};
