/**
 * Tickets API Client
 */
import { httpClient } from './httpClient.js';

export const ticketsApi = {
  getAll: (params) => httpClient.get('/tickets', params),
  getByKey: (ticketKey) => httpClient.get(`/tickets/${ticketKey}`),
  create: (data) => httpClient.post('/tickets', data),
  update: (ticketKey, data) => httpClient.patch(`/tickets/${ticketKey}`, data),
  updateStatus: (ticketKey, status) => httpClient.patch(`/tickets/${ticketKey}/status`, { status }),
  updatePriority: (ticketKey, priority) => httpClient.patch(`/tickets/${ticketKey}/priority`, { priority }),
  updateAssignee: (ticketKey, assigneeId) => httpClient.patch(`/tickets/${ticketKey}/assignee`, { assigneeId }),
  updateSprint: (ticketKey, sprintId) => httpClient.patch(`/tickets/${ticketKey}/sprint`, { sprintId }),
  reassignMemberTickets: ({ projectKey, memberId, newAssigneeId }) =>
    httpClient.post('/tickets/reassign-member', { projectKey, memberId, newAssigneeId }),
  reorderBacklog: ({ projectKey, orderedKeys }) =>
    httpClient.post('/tickets/reorder-backlog', { projectKey, orderedKeys }),
  delete: (ticketKey) => httpClient.delete(`/tickets/${ticketKey}`)
};
