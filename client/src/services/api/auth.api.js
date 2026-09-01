/**
 * Auth API Client
 */
import { httpClient } from './httpClient.js';

export const authApi = {
  login: ({ email, password }) => httpClient.post('/auth/login', { email, password }),
  logout: () => httpClient.post('/auth/logout'),
  getMe: () => httpClient.get('/auth/me')
};
