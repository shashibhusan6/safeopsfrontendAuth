import { apiClient, apiCall } from './config.js';
import { mockEngine } from './mockEngine.js';

export const incidentsApi = {
  getIncidents: (params = {}) =>
    apiCall(
      () => apiClient.get('/incidents', { params }),
      () => mockEngine.getIncidents(params)
    ),

  getIncidentById: (id) =>
    apiCall(
      () => apiClient.get(`/incidents/${id}`),
      () => mockEngine.getIncidentById(id)
    ),

  updateIncidentStatus: (id, updates) => {
    const payload = typeof updates === 'string' ? { status: updates } : updates;
    return apiCall(
      () => apiClient.patch(`/incidents/${id}/status`, payload),
      () => mockEngine.updateIncidentStatus(id, payload)
    );
  },
};
