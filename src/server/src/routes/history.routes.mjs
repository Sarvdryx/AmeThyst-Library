import express from 'express';
import { getHistory, saveHistory, logClick } from '../controllers/history.controllers.mjs';
import { verifyToken } from '../middlewares/auth.middleware.mjs';

const router = express.Router();

// GET /api/search/history
router.get('/api/search/history', verifyToken, getHistory);

// POST /api/search/history
router.post('/api/search/history', verifyToken, saveHistory);

// POST /api/search/history/click
router.post('/api/search/history/click', verifyToken, logClick);

export default router;
