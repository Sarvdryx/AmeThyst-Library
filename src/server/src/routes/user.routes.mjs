import express from 'express';
import { getProfile, updateProfile, changePassword, uploadAvatar } from '../controllers/user.controllers.mjs';
import { avatarCropController } from '../controllers/avatar.crop.controllers.mjs';
import { verifyToken } from '../middlewares/auth.middleware.mjs';
import { handleAvatarUpload } from '../middlewares/multer.middlewares.mjs';
import { validateNewPassword } from '../middlewares/auth-validation.middleware.mjs';

const router = express.Router();

router.get('/profile', verifyToken, getProfile);
router.put('/profile', verifyToken, updateProfile);
router.put('/profile/password', verifyToken, validateNewPassword, changePassword);
router.post('/avatar', verifyToken, handleAvatarUpload, uploadAvatar);
router.post('/avatar/crop', verifyToken, handleAvatarUpload, avatarCropController);

export default router;
