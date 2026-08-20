import express from 'express';
import {
  getUsersList,
  getUsersStats,
  getUserDetails,
  updateUserRole,
  suspendUser,
  unsuspendUser,
  exportUsers,
  getAuditLogs
} from '../controllers/admin.controllers.mjs';
import { verifyToken } from '../middlewares/auth.middleware.mjs';
import { authorizeRole } from '../middlewares/role.middleware.mjs';

const router = express.Router();

// Apply auth token verification and role restriction to all admin endpoints
router.use(verifyToken);
router.use(authorizeRole('admin'));

router.get('/users/stats', getUsersStats);
router.get('/users/export', exportUsers);
router.get('/users', getUsersList);
router.get('/users/:userId', getUserDetails);
router.put('/users/:userId/role', updateUserRole);
router.put('/users/:userId/suspend', suspendUser);
router.put('/users/:userId/unsuspend', unsuspendUser);
router.get('/audit-logs', getAuditLogs);

export default router;
