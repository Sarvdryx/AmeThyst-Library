import * as notificationModels from '../models/notification.models.mjs';
import { emitNotificationRead } from '../config/socket.mjs';

const MIGRATABLE_CATEGORIES = new Set([
  'announcement',
  'study_group_invitation',
  'join_request_submitted',
  'join_request_cancelled',
  'join_request_approved',
  'join_request_denied',
  'member_joined',
  'invitation_declined',
  'group_updated',
  'member_removed',
  'member_left',
  'group_dissolved',
]);

/**
 * Get notifications for a user
 */
export const getNotifications = async (userId) => {
  const notifications = await notificationModels.findInboxByUserId(userId);
  const unreadCount = notificationModels.countUnreadFromInbox(notifications);
  return {
    notifications,
    unreadCount,
  };
};

/**
 * Mark a single notification as read
 */
export const markAsRead = async (userId, notificationId) => {
  const result = await notificationModels.markNotificationRead(userId, notificationId);
  if (result.updated) {
    emitNotificationRead(userId, notificationId);
  }
  return { success: result.found, updated: result.updated };
};

/**
 * Mark all notifications as read for a user
 */
export const markAllAsRead = async (userId) => {
  const updatedCount = await notificationModels.markAllNotificationsRead(userId);
  if (updatedCount > 0) {
    emitNotificationRead(userId, 'ALL');
  }
  return { success: true, updatedCount };
};

/**
 * Migrate local read markers to the database
 */
export const migrateLocalReadMarkers = async (userId, readMarkers) => {
  let totalMigrated = 0;
  let rejectedCount = 0;

  if (Array.isArray(readMarkers)) {
    for (const marker of readMarkers) {
      if (!MIGRATABLE_CATEGORIES.has(marker?.category) || !Array.isArray(marker?.sourceRefIds)) {
        rejectedCount += 1;
        continue;
      }
      const sourceRefIds = [...new Set(marker.sourceRefIds
        .filter((value) => typeof value === 'string')
        .map((value) => value.trim())
        .filter((value) => value.length > 0 && value.length <= 255))]
        .slice(0, 500);
      if (sourceRefIds.length === 0) continue;
      const count = await notificationModels.migrateLegacyReceipts(userId, marker.category, sourceRefIds);
      totalMigrated += count;
    }
  }

  return { success: true, migratedCount: totalMigrated, rejectedCount };
};

/**
 * Save or update a notification (often called internally by other services)
 */
export const saveNotification = async (userId, category, sourceRefId, payload, isRead = false, client) => {
  return notificationModels.saveNotification(userId, category, sourceRefId, payload, isRead, client);
};
