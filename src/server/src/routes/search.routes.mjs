import express from 'express';
import { searchBooks } from '../controllers/search.controllers.mjs';
import { optionalAuth } from '../middlewares/auth.middleware.mjs';

const router = express.Router();

// POST /api/search
router.post('/api/search', optionalAuth, searchBooks);

export default router;
