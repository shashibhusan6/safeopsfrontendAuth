import { apiClient, apiCall } from './config.js';
import { mockEngine } from './mockEngine.js';

export const zonesApi = {
  getZonesByPlant: async (plantId, page = 1, limit = 10, search = '', status = '') => {
    return apiCall(
      () => apiClient.get(`/plants/${plantId}/zones`, { params: { page, limit, search, status } }),
      () => mockEngine.getZones(plantId, page, limit, search, status)
    );
  },

  getAllZones: async (page = 1, limit = 10, search = '', status = '') => {
    return apiCall(
      () => apiClient.get('/zones', { params: { page, limit, search, status } }),
      () => mockEngine.getZones(undefined, page, limit, search, status)
    );
  },

  getZoneById: async (id) => {
    return apiCall(
      () => apiClient.get(`/zones/${id}`),
      () => mockEngine.getZoneById(id)
    );
  },

  createZone: async (plantId, data) => {
    return apiCall(
      () => apiClient.post(`/plants/${plantId}/zones`, data),
      () => mockEngine.createZone(plantId, data)
    );
  },

  enableZone: async (id) => {
    return apiCall(
      () => apiClient.patch(`/zones/${id}/enable`),
      () => mockEngine.enableZone(id)
    );
  },

  disableZone: async (id) => {
    return apiCall(
      () => apiClient.patch(`/zones/${id}/disable`),
      () => mockEngine.disableZone(id)
    );
  },

  updateZoneStatus: async (id, status) => {
    return apiCall(
      () => apiClient.patch(`/zones/${id}/status`, { status }),
      () => mockEngine.updateZoneStatus(id, status)
    );
  },

  updateZone: async (id, data) => {
    return apiCall(
      () => apiClient.patch(`/zones/${id}`, data),
      () => mockEngine.updateZone(id, data)
    );
  },

  deleteZone: async (id) => {
    return apiCall(
      () => apiClient.delete(`/zones/${id}`),
      () => mockEngine.deleteZone(id)
    );
  },
};
