import { apiClient, apiCall } from './config.js';
import { mockEngine } from './mockEngine.js';

export const safetyRulesApi = {
  getSafetyRules: (params = {}) =>
    apiCall(
      () => apiClient.get('/safety-rules', { params }),
      () => mockEngine.getSafetyRules(params)
    ),

  getRules: (params = {}) =>
    apiCall(
      () => apiClient.get('/safety-rules', { params }),
      () => mockEngine.getSafetyRules(params)
    ),

  createSafetyRule: (ruleData) =>
    apiCall(
      () => apiClient.post('/safety-rules', ruleData),
      () => mockEngine.createSafetyRule(ruleData)
    ),

  createRule: (ruleData) =>
    apiCall(
      () => apiClient.post('/safety-rules', ruleData),
      () => mockEngine.createSafetyRule(ruleData)
    ),

  updateSafetyRule: (id, ruleData) =>
    apiCall(
      () => apiClient.put(`/safety-rules/${id}`, ruleData),
      () => mockEngine.updateSafetyRule(id, ruleData)
    ),

  updateRule: (id, ruleData) =>
    apiCall(
      () => apiClient.put(`/safety-rules/${id}`, ruleData),
      () => mockEngine.updateSafetyRule(id, ruleData)
    ),

  toggleSafetyRuleStatus: (id) =>
    apiCall(
      () => apiClient.patch(`/safety-rules/${id}/toggle`),
      () => mockEngine.toggleSafetyRuleStatus(id)
    ),

  toggleRuleStatus: (id) =>
    apiCall(
      () => apiClient.patch(`/safety-rules/${id}/toggle`),
      () => mockEngine.toggleSafetyRuleStatus(id)
    ),
};
