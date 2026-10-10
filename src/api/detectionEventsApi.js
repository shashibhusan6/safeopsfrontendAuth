import { apiClient, apiCall } from './config.js';
import { mockEngine } from './mockEngine.js';

export const detectionEventsApi = {
  getDetectionEvents: (params = {}) =>
    apiCall(
      () => apiClient.get('/detection-events', { params }),
      () => mockEngine.getDetectionEvents(params)
    ),

  getEvents: (params = {}) =>
    apiCall(
      () => apiClient.get('/detection-events', { params }),
      () => mockEngine.getDetectionEvents(params)
    ),
};
