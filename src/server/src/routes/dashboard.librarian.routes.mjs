import express from 'express';
import { getPickups, verifyPin, confirmBorrowing, cancelBorrowing, verifyReturnPin, previewReturnPenalty, confirmReturn, getOutstandingDebts, getPaidFees, getActiveBorrowings, confirmPayment, verifyRoomPin, confirmRoomCheckin, getRoomsOverview, getActiveReservations, getRoomSchedule, getReservationDetail } from '../controllers/dashboard.librarian.controllers.mjs';
import {
  createAnnouncementController,
  getAnnouncementsForManagementController,
  getAnnouncementByIdController,
  updateAnnouncementStatusController,
  editAnnouncementDetailsController,
  deleteAnnouncementController
} from '../controllers/announcement.controllers.mjs';
import { verifyToken } from '../middlewares/auth.middleware.mjs';
import { authorizeRole } from '../middlewares/role.middleware.mjs';
import { requireLibrarianBranch } from '../middlewares/security.middleware.mjs';

const router = express.Router();

const librarianOnly = [authorizeRole('librarian'), requireLibrarianBranch];
const managementOnly = authorizeRole('librarian', 'admin');

router.use(verifyToken);

router.get('/pickups', ...librarianOnly, getPickups);
router.post('/verify-pin', ...librarianOnly, verifyPin);
router.post('/confirm-borrowing', ...librarianOnly, confirmBorrowing);
router.post('/cancel-borrowing', ...librarianOnly, cancelBorrowing);

// Announcement management routes
router.post('/announcements', managementOnly, createAnnouncementController);
router.get('/announcements', managementOnly, getAnnouncementsForManagementController);
router.get('/announcements/:id', managementOnly, getAnnouncementByIdController);
router.patch('/announcements/:id/status', managementOnly, updateAnnouncementStatusController);
router.put('/announcements/:id', managementOnly, editAnnouncementDetailsController);
router.delete('/announcements/:id', managementOnly, deleteAnnouncementController);
router.post('/verify-return-pin', ...librarianOnly, verifyReturnPin);
router.post('/return-penalty-preview', ...librarianOnly, previewReturnPenalty);
router.post('/confirm-return', ...librarianOnly, confirmReturn);
router.get('/active-borrowings', ...librarianOnly, getActiveBorrowings);
router.get('/loan-fees/outstanding', ...librarianOnly, getOutstandingDebts);
router.get('/loan-fees/history', ...librarianOnly, getPaidFees);
router.post('/loan-fees/confirm-payment', ...librarianOnly, confirmPayment);
router.post('/verify-room-pin', ...librarianOnly, verifyRoomPin);
router.post('/confirm-room-checkin', ...librarianOnly, confirmRoomCheckin);
router.get('/rooms/overview', ...librarianOnly, getRoomsOverview);
router.get('/rooms/reservations', ...librarianOnly, getActiveReservations);
router.get('/rooms/schedule', ...librarianOnly, getRoomSchedule);
router.get('/rooms/reservations/:reserveId', ...librarianOnly, getReservationDetail);

export default router;
