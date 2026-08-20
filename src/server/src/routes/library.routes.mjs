import { Router } from 'express';
import {
  getAllBooks,
  getBookDetails,
  getBookRecommendations,
  getRelatedBooks,
  reserveBook,
  createBook,
  updateBook,
  deleteBook,
  getBranches,
  uploadCoverController
} from '../controllers/library.controller.mjs';
import { verifyToken } from '../middlewares/auth.middleware.mjs';
import { authorizeRole } from '../middlewares/role.middleware.mjs';
import { validateBookFilters } from '../middlewares/validation.middleware.mjs';
import { handleAvatarUpload } from '../middlewares/multer.middlewares.mjs';

const router = Router();

router.get('/api/library/books', validateBookFilters, getAllBooks);
router.get('/api/library/books/:id', getBookDetails);
router.get('/api/library/books/:id/recommendations', getBookRecommendations);
router.get('/api/library/books/:id/related', getRelatedBooks);
router.post('/api/library/reserve', verifyToken, authorizeRole('user'), reserveBook);

// Catalog Book CRUD endpoints
router.get('/api/branches', getBranches);
router.post('/api/books/upload-cover', verifyToken, authorizeRole('librarian', 'admin'), handleAvatarUpload, uploadCoverController);
router.post('/api/books', verifyToken, authorizeRole('librarian', 'admin'), createBook);
router.put('/api/books/:id', verifyToken, authorizeRole('librarian', 'admin'), updateBook);
router.delete('/api/books/:id', verifyToken, authorizeRole('librarian', 'admin'), deleteBook);

export default router;