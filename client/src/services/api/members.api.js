/**
 * Members API Client
 */
import { httpClient } from './httpClient.js';

export const membersApi = {
  getAll: (params) => httpClient.get('/members', params),
  getById: (memberId) => httpClient.get(`/members/${memberId}`),
  create: (data) => httpClient.post('/members', data),
  update: (memberId, data) => httpClient.patch(`/members/${memberId}`, data),
  delete: (memberId) => httpClient.delete(`/members/${memberId}`)
};
