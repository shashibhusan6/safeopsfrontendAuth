import { apiClient, apiCall } from './config.js';
import { mockEngine } from './mockEngine.js';

export const usersApi = {
  getUsers: async (page = 1, limit = 10, search = '', role = '', status = '') => {
    return apiCall(
      () => apiClient.get('/users', { params: { page, limit, search, role, status } }),
      () => mockEngine.getUsers(page, limit, search, role, status)
    );
  },

  getUserById: async (id) => {
    return apiCall(
      () => apiClient.get(`/users/${id}`),
      () => mockEngine.getUserById(id)
    );
  },

  inviteUser: async (data) => {
    return apiCall(
      () => apiClient.post('/users/invite', data),
      () => mockEngine.inviteUser(data)
    );
  },

  enableUser: async (id) => {
    return apiCall(
      () => apiClient.patch(`/users/${id}/enable`),
      () => mockEngine.enableUser(id)
    );
  },

  disableUser: async (id) => {
    return apiCall(
      () => apiClient.patch(`/users/${id}/disable`),
      () => mockEngine.disableUser(id)
    );
  },

  updateUserStatus: async (id, account_status) => {
    return apiCall(
      () => apiClient.patch(`/users/${id}/status`, { account_status }),
      () => mockEngine.updateUserStatus(id, account_status)
    );
  },

  updateUser: async (id, data) => {
    return apiCall(
      () => apiClient.patch(`/users/${id}`, data),
      () => mockEngine.updateUser(id, data)
    );
  },

  deleteUser: async (id) => {
    return apiCall(
      () => apiClient.delete(`/users/${id}`),
      () => mockEngine.deleteUser(id)
    );
  },
};
