import express from 'express';
import { verifyToken } from '../middlewares/auth.middleware.mjs';
import { authorizeRole } from '../middlewares/role.middleware.mjs';
import { getAdminStatistics } from '../controllers/statistics.controllers.mjs';

const router = express.Router();

/**
 * @route GET /api/admin/statistics
 * @desc Get executive statistics and reports for Admin Dashboard
 * @access Admin only
 */
router.get('/', verifyToken, authorizeRole('admin'), getAdminStatistics);

export default router;
