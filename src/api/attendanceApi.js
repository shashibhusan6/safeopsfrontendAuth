import { apiClient, apiCall } from './config.js';
import { mockEngine } from './mockEngine.js';

export const attendanceApi = {
  scanQRCode: async (qrToken, plantId = null) => {
    return apiCall(
      () => apiClient.post('/attendance/scan', { qrToken, plantId }),
      () => mockEngine.scanQRCode(qrToken, plantId)
    );
  },

  getAttendanceLogs: async (page = 1, limit = 10, search = '', plantId = undefined, date = '') => {
    return apiCall(
      () => apiClient.get('/attendance/logs', { params: { page, limit, search, plantId, date } }),
      () => mockEngine.getAttendanceLogs(page, limit, search, plantId, date)
    );
  },

  getEmployeeQRCode: async (userId) => {
    return apiCall(
      () => apiClient.get(`/users/${userId}/qr-code`),
      () => mockEngine.getEmployeeQRCode(userId)
    );
  },
};
