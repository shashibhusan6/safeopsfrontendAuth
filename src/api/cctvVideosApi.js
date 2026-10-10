import { apiClient, apiCall } from './config.js';
import { mockEngine } from './mockEngine.js';

export const cctvVideosApi = {
  getCCTVVideos: (params = {}) =>
    apiCall(
      () => apiClient.get('/cctv-videos', { params }),
      () => mockEngine.getCCTVVideos(params)
    ),

  uploadCCTVVideo: (videoData) =>
    apiCall(
      () => apiClient.post('/cctv-videos', videoData),
      () => mockEngine.uploadCCTVVideo(videoData)
    ),
};
