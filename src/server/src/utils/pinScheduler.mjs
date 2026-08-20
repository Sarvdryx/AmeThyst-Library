import { clearAllPins, cleanupExpiredPins, cleanupExpiredReservations } from '../services/library.services.mjs';
import { backfillDefaultedCheckouts } from '../models/room.models.mjs';
import { emitRoomDashboardChanged } from '../config/socket.mjs';

export const runStartupPinCleanup = async () => {
  try {
    const [pinCount, resCount, backfill] = await Promise.all([
      clearAllPins(),
      cleanupExpiredReservations(),
      backfillDefaultedCheckouts(),
    ]);
    if (pinCount > 0) {
      console.log(`Cleared ${pinCount} pending PIN(s) (books + rooms) on startup`);
    }
    if (resCount > 0) {
      console.log(`Cleaned up ${resCount} expired reservation(s) on startup`);
    }
    if (backfill.count > 0) {
      console.log(`Backfilled ${backfill.count} defaulted room checkout(s) on startup`);
      for (const branchId of backfill.branchIds) {
        emitRoomDashboardChanged(branchId, 'checkout_defaulted');
      }
    }
    return { pinCount, resCount, backfilled: backfill.count };
  } catch (err) {
    console.error('Startup cleanup failed:', err);
    return { pinCount: 0, resCount: 0, backfilled: 0 };
  }
};

export const startPeriodicPinCleanup = (intervalMs = 60 * 1000) => {
  const intervalId = setInterval(async () => {
    try {
      const [pinResult, resCount, backfill] = await Promise.all([
        cleanupExpiredPins(),
        cleanupExpiredReservations(),
        backfillDefaultedCheckouts(),
      ]);
      if (pinResult.count > 0) {
        console.log(`Cleaned up ${pinResult.count} expired PIN(s) (books + rooms)`);
        for (const branchId of pinResult.branchIds) {
          emitRoomDashboardChanged(branchId, 'pin_expired');
        }
      }
      if (resCount > 0) {
        console.log(`Cleaned up ${resCount} expired reservation(s)`);
      }
      if (backfill.count > 0) {
        console.log(`Backfilled ${backfill.count} defaulted room checkout(s)`);
        for (const branchId of backfill.branchIds) {
          emitRoomDashboardChanged(branchId, 'checkout_defaulted');
        }
      }
    } catch (err) {
      console.error('Periodic cleanup failed:', err);
    }
  }, intervalMs);
  return intervalId;
};
