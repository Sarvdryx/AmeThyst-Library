import express from 'express';
import { getRoomDetailsController, getRoomAvailabilityController, getStudyGroupFilterOptionsController, createReservationController, getUserReservationsController, cancelReservationController, generateRoomPinController, cleanupRoomPinController, confirmCheckoutController, getRoomHistoryController } from '../controllers/room.controllers.mjs';
import { verifyToken } from '../middlewares/auth.middleware.mjs';

const router = express.Router();

router.get('/study-group-filter-options', getStudyGroupFilterOptionsController);
router.get('/details', getRoomDetailsController);
router.get('/availability', getRoomAvailabilityController);
router.post('/reserve', verifyToken, createReservationController);
router.get('/user-reservations', verifyToken, getUserReservationsController);
router.get('/history', verifyToken, getRoomHistoryController);
router.delete('/reserve/:reserveId', verifyToken, cancelReservationController);
router.post('/reserve/:reserveId/pin', verifyToken, generateRoomPinController);
router.post('/reserve/:reserveId/pin/cleanup', verifyToken, cleanupRoomPinController);
router.post('/reserve/:reserveId/checkout', verifyToken, confirmCheckoutController);

export default router;
