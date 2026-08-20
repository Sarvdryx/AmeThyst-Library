import express from 'express';
import { getActiveAnnouncementsController } from '../controllers/announcement.controllers.mjs';

const router = express.Router();

// Public endpoint to view active, non-expired announcements
router.get('/', getActiveAnnouncementsController);

export default router;
