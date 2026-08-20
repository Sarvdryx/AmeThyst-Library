import { Router } from 'express';
import { verifyToken } from '../middlewares/auth.middleware.mjs';
import { authorizeRole } from '../middlewares/role.middleware.mjs';
import {
  getWishlist,
  checkStatus,
  addBook,
  removeBook
} from '../controllers/wishlist.controllers.mjs';

const router = Router();

// All wishlist routes are restricted to logged-in users with the 'user' role
router.use(verifyToken, authorizeRole('user'));

router.get('/', getWishlist);
router.get('/status/:bookId', checkStatus);
router.post('/:bookId', addBook);
router.delete('/:bookId', removeBook);

export default router;
