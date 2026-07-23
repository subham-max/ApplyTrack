// src/routes/applications.routes.ts
import { Router } from 'express';
import { applicationsController } from '../controllers/application.controller';
import { asyncHandler } from '../middlewares/asyncHandler';

const router = Router();

router.get('/', asyncHandler(applicationsController.list));
router.get('/:id', asyncHandler(applicationsController.getById));
router.post('/', asyncHandler(applicationsController.create));
router.patch('/:id', asyncHandler(applicationsController.update));
router.patch('/:id/status', asyncHandler(applicationsController.updateStatus));
router.delete('/:id', asyncHandler(applicationsController.remove));

export default router;