import { expireOutdatedAnnouncementsService } from '../services/announcement.services.mjs';

/**
 * Runs the announcement expiration check once on startup.
 * @returns {Promise<Array>} List of expired announcements.
 */
export const runStartupCleanup = async () => {
  try {
    const expiredList = await expireOutdatedAnnouncementsService();
    if (expiredList && expiredList.length > 0) {
      console.log(`[Announcement Scheduler] Expired ${expiredList.length} outdated announcement(s) on startup.`);
    }
    return expiredList;
  } catch (err) {
    console.error('[Announcement Scheduler] Startup announcement cleanup failed:', err);
    return [];
  }
};

/**
 * Starts the periodic announcement expiration check (default interval: 1 hour).
 * @param {number} [intervalMs]
 * @returns {NodeJS.Timeout} The interval object ID.
 */
export const startPeriodicCleanup = (intervalMs = 60 * 60 * 1000) => {
  const intervalId = setInterval(async () => {
    try {
      const expiredList = await expireOutdatedAnnouncementsService();
      if (expiredList && expiredList.length > 0) {
        console.log(`[Announcement Scheduler] Cleaned up/Expired ${expiredList.length} outdated announcement(s).`);
      }
    } catch (err) {
      console.error('[Announcement Scheduler] Periodic announcement cleanup failed:', err);
    }
  }, intervalMs);
  return intervalId;
};
