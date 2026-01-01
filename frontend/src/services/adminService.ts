import { apiGet, apiSend } from './apiClient';

export interface AdminSubmissionResponse {
  contributions: any[];
  remembrances: any[];
}

export const getSubmissions = async (): Promise<AdminSubmissionResponse> => {
  return apiGet<AdminSubmissionResponse>('/admin/submissions');
};

export const approveRemembrance = async (id: string): Promise<any> => {
  return apiSend(`/admin/remembrances/${id}/approve`, 'PUT');
};

export const approveContribution = async (id: string): Promise<any> => {
  return apiSend(`/admin/contributions/${id}/approve`, 'PUT');
};

export const rejectContribution = async (id: string): Promise<any> => {
  return apiSend(`/admin/contributions/${id}/reject`, 'PUT');
};
