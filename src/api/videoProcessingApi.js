import { apiClient, apiCall } from './config.js';
import { mockEngine } from './mockEngine.js';

export const videoProcessingApi = {
  getVideoJobs: (params = {}) =>
    apiCall(
      () => apiClient.get('/video-jobs', { params }),
      () => mockEngine.getVideoJobs(params)
    ),

  getJobs: (params = {}) =>
    apiCall(
      () => apiClient.get('/video-jobs', { params }),
      () => mockEngine.getVideoJobs(params)
    ),

  startVideoJob: (jobPayload) =>
    apiCall(
      () => apiClient.post('/video-jobs/start', jobPayload),
      () => mockEngine.startVideoJob(jobPayload)
    ),

  startProcessingJob: (jobPayload) =>
    apiCall(
      () => apiClient.post('/video-jobs/start', jobPayload),
      () => mockEngine.startVideoJob(jobPayload)
    ),
};
