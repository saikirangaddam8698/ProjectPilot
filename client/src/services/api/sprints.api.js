/**
 * Sprints API Client
 */
import { httpClient } from './httpClient.js';

export const sprintsApi = {
  getAll: (params) => httpClient.get('/sprints', params),
  getById: (sprintId) => httpClient.get(`/sprints/${sprintId}`),
  create: (data) => httpClient.post('/sprints', data),
  update: (sprintId, data) => httpClient.patch(`/sprints/${sprintId}`, data),
  start: (sprintId) => httpClient.post(`/sprints/${sprintId}/start`),
  complete: (sprintId, options = {}) => httpClient.post(`/sprints/${sprintId}/complete`, options),
  delete: (sprintId) => httpClient.delete(`/sprints/${sprintId}`)
};
