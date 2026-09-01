/**
 * Activities API Client
 */
import { httpClient } from './httpClient.js';

export const activitiesApi = {
  getAll: (params) => httpClient.get('/activities', params),
  record: (data) => httpClient.post('/activities', data)
};
