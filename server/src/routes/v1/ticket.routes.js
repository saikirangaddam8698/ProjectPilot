import { Router } from 'express';
import { TicketController } from '../../controllers/ticket.controller.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { validate } from '../../middleware/validate.js';
import { authenticate, requireRole, requireProjectAccess } from '../../middleware/auth.middleware.js';
import {
  createTicketSchema,
  updateTicketSchema,
  updateTicketStatusSchema,
  updateTicketPrioritySchema,
  reassignMemberTicketsSchema
} from '../../validators/ticket.validator.js';

const router = Router();

// Protect all ticket endpoints with authentication
router.use(authenticate);

// GET /api/v1/tickets
router.get('/', asyncHandler(TicketController.getAllTickets));

// POST /api/v1/tickets
router.post(
  '/',
  requireRole('ADMIN', 'PROJECT_MANAGER', 'DEVELOPER'),
  requireProjectAccess(),
  validate(createTicketSchema),
  asyncHandler(TicketController.createTicket)
);

// POST /api/v1/tickets/reassign-member
router.post(
  '/reassign-member',
  requireRole('ADMIN', 'PROJECT_MANAGER'),
  requireProjectAccess('Project Admin'),
  validate(reassignMemberTicketsSchema),
  asyncHandler(TicketController.reassignMemberTickets)
);

// POST /api/v1/tickets/reorder-backlog
router.post(
  '/reorder-backlog',
  requireRole('ADMIN', 'PROJECT_MANAGER', 'DEVELOPER'),
  requireProjectAccess(),
  asyncHandler(TicketController.reorderBacklog)
);

// GET /api/v1/tickets/:ticketKey
router.get('/:ticketKey', asyncHandler(TicketController.getTicketByKey));

// PATCH /api/v1/tickets/:ticketKey
router.patch(
  '/:ticketKey',
  requireRole('ADMIN', 'PROJECT_MANAGER', 'DEVELOPER'),
  validate(updateTicketSchema),
  asyncHandler(TicketController.updateTicket)
);

// PATCH /api/v1/tickets/:ticketKey/status
router.patch(
  '/:ticketKey/status',
  requireRole('ADMIN', 'PROJECT_MANAGER', 'DEVELOPER'),
  validate(updateTicketStatusSchema),
  asyncHandler(TicketController.updateTicketStatus)
);

// PATCH /api/v1/tickets/:ticketKey/priority
router.patch(
  '/:ticketKey/priority',
  requireRole('ADMIN', 'PROJECT_MANAGER', 'DEVELOPER'),
  validate(updateTicketPrioritySchema),
  asyncHandler(TicketController.updateTicketPriority)
);

// PATCH /api/v1/tickets/:ticketKey/assignee
router.patch(
  '/:ticketKey/assignee',
  requireRole('ADMIN', 'PROJECT_MANAGER', 'DEVELOPER'),
  asyncHandler(TicketController.updateTicketAssignee)
);

// PATCH /api/v1/tickets/:ticketKey/sprint
router.patch(
  '/:ticketKey/sprint',
  requireRole('ADMIN', 'PROJECT_MANAGER', 'DEVELOPER'),
  asyncHandler(TicketController.assignTicketToSprint)
);

// DELETE /api/v1/tickets/:ticketKey (Project Manager or Admin)
router.delete(
  '/:ticketKey',
  requireRole('ADMIN', 'PROJECT_MANAGER'),
  asyncHandler(TicketController.deleteTicket)
);

export default router;
