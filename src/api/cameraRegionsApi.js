import { apiClient, apiCall } from './config.js';
import { mockEngine } from './mockEngine.js';

export const cameraRegionsApi = {
  getCameraRegions: (params = {}) =>
    apiCall(
      () => apiClient.get('/camera-regions', { params }),
      () => mockEngine.getCameraRegions(params)
    ),

  getRegions: (params = {}) =>
    apiCall(
      () => apiClient.get('/camera-regions', { params }),
      () => mockEngine.getCameraRegions(params)
    ),

  createCameraRegion: (regionData) =>
    apiCall(
      () => apiClient.post('/camera-regions', regionData),
      () => mockEngine.createCameraRegion(regionData)
    ),

  createRegion: (regionData) =>
    apiCall(
      () => apiClient.post('/camera-regions', regionData),
      () => mockEngine.createCameraRegion(regionData)
    ),

  updateCameraRegion: (id, regionData) =>
    apiCall(
      () => apiClient.put(`/camera-regions/${id}`, regionData),
      () => mockEngine.updateCameraRegion(id, regionData)
    ),

  updateRegion: (id, regionData) =>
    apiCall(
      () => apiClient.put(`/camera-regions/${id}`, regionData),
      () => mockEngine.updateCameraRegion(id, regionData)
    ),
};
