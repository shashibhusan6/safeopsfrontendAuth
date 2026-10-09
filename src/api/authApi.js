import { apiClient, apiCall } from './config.js';
import { mockEngine } from './mockEngine.js';

export const authApi = {
  login: async (identifier, password_hash) => {
    return apiCall(
      () => apiClient.post('/auth/login', { identifier, email: identifier, phone: identifier, password: password_hash }),
      () => mockEngine.login(identifier, password_hash)
    );
  },

  getMe: async () => {
    return apiCall(
      () => apiClient.get('/auth/me'),
      () => mockEngine.me()
    );
  },

  acceptInvite: async (token, password_hash) => {
    return apiCall(
      () => apiClient.post('/auth/accept-invite', { token, password: password_hash }),
      () => mockEngine.acceptInvite(token, password_hash)
    );
  },
};
