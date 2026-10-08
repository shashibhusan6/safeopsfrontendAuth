import { apiClient, apiCall } from './config.js';
import { mockEngine } from './mockEngine.js';

export const plantsApi = {
  getPlants: async (page = 1, limit = 10, search = '', status = '') => {
    return apiCall(
      () => apiClient.get('/plants', { params: { page, limit, search, status } }),
      () => mockEngine.getPlants(page, limit, search, status)
    );
  },

  getPlantById: async (id) => {
    return apiCall(
      () => apiClient.get(`/plants/${id}`),
      () => mockEngine.getPlantById(id)
    );
  },

  createPlant: async (data) => {
    return apiCall(
      () => apiClient.post('/plants', data),
      () => mockEngine.createPlant(data)
    );
  },

  enablePlant: async (id) => {
    return apiCall(
      () => apiClient.patch(`/plants/${id}/enable`),
      () => mockEngine.enablePlant(id)
    );
  },

  disablePlant: async (id) => {
    return apiCall(
      () => apiClient.patch(`/plants/${id}/disable`),
      () => mockEngine.disablePlant(id)
    );
  },

  updatePlantStatus: async (id, status) => {
    return apiCall(
      () => apiClient.patch(`/plants/${id}/status`, { status }),
      () => mockEngine.updatePlantStatus(id, status)
    );
  },

  updatePlant: async (id, data) => {
    return apiCall(
      () => apiClient.patch(`/plants/${id}`, data),
      () => mockEngine.updatePlant(id, data)
    );
  },

  deletePlant: async (id) => {
    return apiCall(
      () => apiClient.delete(`/plants/${id}`),
      () => mockEngine.deletePlant(id)
    );
  },
};
