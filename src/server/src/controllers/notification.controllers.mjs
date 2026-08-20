import * as notificationServices from '../services/notification.services.mjs';

const internalError = (res) => res.status(500).json({
  success: false,
  message: 'An unexpected error occurred.',
});

export const getNotifications = async (req, res) => {
  try {
    const userId = req.user.userId;
    const result = await notificationServices.getNotifications(userId);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('getNotifications failed:', error);
    internalError(res);
  }
};

export const markAsRead = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ success: false, message: 'Notification ID is required' });
    }

    const result = await notificationServices.markAsRead(userId, id);
    if (!result.success) {
      return res.status(404).json({
        success: false,
        updated: false,
        message: 'Notification not found',
      });
    }
    res.json(result);
  } catch (error) {
    console.error('markAsRead failed:', error);
    internalError(res);
  }
};

export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.userId;
    const result = await notificationServices.markAllAsRead(userId);
    res.json(result);
  } catch (error) {
    console.error('markAllAsRead failed:', error);
    internalError(res);
  }
};

export const migrateLocal = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { markers } = req.body;

    if (!Array.isArray(markers)) {
      return res.status(400).json({ success: false, message: 'markers must be an array' });
    }

    const result = await notificationServices.migrateLocalReadMarkers(userId, markers);
    res.json(result);
  } catch (error) {
    console.error('migrateLocal failed:', error);
    internalError(res);
  }
};
