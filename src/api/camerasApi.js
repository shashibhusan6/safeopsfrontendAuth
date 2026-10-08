import { apiClient, apiCall } from './config.js';
import { mockEngine } from './mockEngine.js';

export const camerasApi = {
  getCamerasByZone: async (zoneId, page = 1, limit = 10, search = '', status = '') => {
    return apiCall(
      () => apiClient.get(`/zones/${zoneId}/cameras`, { params: { page, limit, search, status } }),
      () => mockEngine.getCameras(zoneId, page, limit, search, status)
    );
  },

  getAllCameras: async (page = 1, limit = 10, search = '', status = '', plantId = undefined, zoneId = undefined) => {
    return apiCall(
      () => apiClient.get('/cameras', { params: { page, limit, search, status, plantId, zoneId } }),
      () => mockEngine.getCameras(zoneId, page, limit, search, status, plantId)
    );
  },

  getCameraById: async (id) => {
    return apiCall(
      () => apiClient.get(`/cameras/${id}`),
      () => mockEngine.getCameraById(id)
    );
  },

  createCamera: async (zoneId, data) => {
    return apiCall(
      () => apiClient.post(`/zones/${zoneId}/cameras`, data),
      () => mockEngine.createCamera(zoneId, data)
    );
  },

  enableCamera: async (id) => {
    return apiCall(
      () => apiClient.patch(`/cameras/${id}/enable`),
      () => mockEngine.enableCamera(id)
    );
  },

  disableCamera: async (id) => {
    return apiCall(
      () => apiClient.patch(`/cameras/${id}/disable`),
      () => mockEngine.disableCamera(id)
    );
  },

  updateCameraStatus: async (id, is_active) => {
    return apiCall(
      () => apiClient.patch(`/cameras/${id}/status`, { is_active }),
      () => mockEngine.updateCameraStatus(id, is_active)
    );
  },

  updateCamera: async (id, data) => {
    return apiCall(
      () => apiClient.patch(`/cameras/${id}`, data),
      () => mockEngine.updateCamera(id, data)
    );
  },

  deleteCamera: async (id) => {
    return apiCall(
      () => apiClient.delete(`/cameras/${id}`),
      () => mockEngine.deleteCamera(id)
    );
  },
};
