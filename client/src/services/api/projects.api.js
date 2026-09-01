/**
 * Projects API Client
 */
import { httpClient } from './httpClient.js';

export const projectsApi = {
  getAll: (params) => httpClient.get('/projects', params),
  getByKey: (projectKey) => httpClient.get(`/projects/${projectKey}`),
  create: (data) => httpClient.post('/projects', data),
  update: (projectKey, data) => httpClient.patch(`/projects/${projectKey}`, data),
  delete: (projectKey) => httpClient.delete(`/projects/${projectKey}`),
  addMember: (projectKey, data) => httpClient.post(`/projects/${projectKey}/members`, data),
  removeMember: (projectKey, memberId) => httpClient.delete(`/projects/${projectKey}/members/${memberId}`)
};
