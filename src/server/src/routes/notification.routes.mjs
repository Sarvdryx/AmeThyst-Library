import express from 'express';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  migrateLocal,
} from '../controllers/notification.controllers.mjs';
import { verifyToken } from '../middlewares/auth.middleware.mjs';

const router = express.Router();

router.use(verifyToken); // All routes require authentication

router.get('/', getNotifications);
router.patch('/read-all', markAllAsRead);
router.patch('/:id/read', markAsRead);
router.post('/migrate-local', migrateLocal);

export default router;
