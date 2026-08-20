import express from 'express';
import { generatePin, cleanupPin, cancelReservation, getMyBorrowRecords, generateReturnPin, extendDueDate, cleanupReturnPin, getUserFees, getBorrowingHistory } from '../controllers/dashboard.user.controllers.mjs';
import { verifyToken } from '../middlewares/auth.middleware.mjs';

const router = express.Router();

router.post('/reserve/:reservationId/pin', verifyToken, generatePin);
router.post('/reserve/:reservationId/pin/cleanup', verifyToken, cleanupPin);
router.delete('/reserve/:reservationId', verifyToken, cancelReservation);
router.get('/my-borrowed', verifyToken, getMyBorrowRecords);
router.post('/borrowed/generate-return-pin', verifyToken, generateReturnPin);
router.post('/borrowed/extend-due-date', verifyToken, extendDueDate);
router.post('/borrowed/:borrowId/return-pin/cleanup', verifyToken, cleanupReturnPin);
router.get('/fees', verifyToken, getUserFees);
router.get('/borrowing-history', verifyToken, getBorrowingHistory);

export default router;
