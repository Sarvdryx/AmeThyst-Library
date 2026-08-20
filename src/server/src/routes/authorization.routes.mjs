import express from 'express';
import { verifyToken } from '../middlewares/auth.middleware.mjs';
import { authorizeRole } from '../middlewares/role.middleware.mjs';
import {
  getUsers,
  promote,
  demote,
  inviteAdmin,
  getHistory,
} from '../controllers/authorization.controllers.mjs';

const router = express.Router();

router.use(verifyToken);
router.use(authorizeRole('admin'));

router.get('/users', getUsers);
router.post('/users/:userId/promote', promote);
router.post('/users/:userId/demote', demote);
router.post('/invite-admin', inviteAdmin);
router.get('/history', getHistory);

export default router;
