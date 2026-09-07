/**
 * Knowledge Base Routes
 * Mounted under /api/v1/projects/:projectKey/knowledge
 */
import { Router } from 'express';
import { KnowledgeController } from '../../controllers/knowledge.controller.js';
import { authenticate, requireProjectAccess } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.js';
import {
  createDocumentSchema,
  updateDocumentSchema,
  searchKnowledgeSchema
} from '../../validators/knowledge.validator.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const router = Router({ mergeParams: true });

// All knowledge endpoints require authenticated session and project access
router.use(authenticate);
router.use(requireProjectAccess());

// Semantic search within project
router.post(
  '/search',
  validate(searchKnowledgeSchema),
  asyncHandler(KnowledgeController.searchKnowledge)
);

// Document CRUD & Indexing
router
  .route('/')
  .get(asyncHandler(KnowledgeController.listDocuments))
  .post(validate(createDocumentSchema), asyncHandler(KnowledgeController.createDocument));

router
  .route('/:documentId')
  .get(asyncHandler(KnowledgeController.getDocument))
  .put(validate(updateDocumentSchema), asyncHandler(KnowledgeController.updateDocument))
  .delete(asyncHandler(KnowledgeController.deleteDocument));

router.post(
  '/:documentId/index',
  asyncHandler(KnowledgeController.indexDocument)
);

router.post(
  '/:documentId/reindex',
  asyncHandler(KnowledgeController.indexDocument)
);

export default router;
