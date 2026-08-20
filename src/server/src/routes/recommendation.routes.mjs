import { Router } from 'express';
import { verifyToken } from '../middlewares/auth.middleware.mjs';
import { authorizeRole } from '../middlewares/role.middleware.mjs';
import {
  getRecommendations,
  renewRecommendations,
  clickRecommendation,
  getRetrainingStatusController
} from '../controllers/recommendation.controllers.mjs';

const router = Router();

// User endpoints
router.get('/api/dashboard/user/recommendations', verifyToken, getRecommendations);
router.post('/api/dashboard/user/recommendations/renew', verifyToken, renewRecommendations);
router.post('/api/dashboard/user/recommendations/:bookId/click', verifyToken, clickRecommendation);

// Admin endpoints
router.get('/api/dashboard/admin/recommendations/retrain-status', verifyToken, authorizeRole('admin'), getRetrainingStatusController);

export default router;
