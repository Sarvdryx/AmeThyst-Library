import express from 'express';
import { register, login, forgot, verify, reset, verifyEmailHandler, resendVerification, googleAuth, googleCallback, refresh, logout, me, csrf } from '../controllers/auth.controllers.mjs';
import { verifyToken } from '../middlewares/auth.middleware.mjs';
import { loginLimiter, otpLimiter, recoveryLimiter, registerLimiter } from '../middlewares/security.middleware.mjs';
import { validateEmailBody, validateNewPassword, validateRegistration } from '../middlewares/auth-validation.middleware.mjs';

const router = express.Router();

router.get('/csrf', csrf);
router.get('/me', verifyToken, me);
router.post('/register', registerLimiter, validateRegistration, register);
router.post('/login', loginLimiter, validateEmailBody, login);
router.post('/forgot-password', recoveryLimiter, validateEmailBody, forgot);
router.post('/verify-otp', otpLimiter, validateEmailBody, verify);
router.post('/reset-password', recoveryLimiter, validateEmailBody, validateNewPassword, reset);
router.post('/verify-email', verifyEmailHandler);
router.post('/resend-verification', recoveryLimiter, validateEmailBody, resendVerification);
router.post('/refresh', refresh);
router.post('/logout', logout);

router.get('/google', googleAuth);
router.get('/google/callback', ...googleCallback);

export default router;
