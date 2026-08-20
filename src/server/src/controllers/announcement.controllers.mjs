import * as announcementService from '../services/announcement.services.mjs';

/**
 * Controller to create a new announcement (default status = 'draft').
 */
export const createAnnouncementController = async (req, res) => {
  try {
    const { title, content, expired_date, status } = req.body;

    const announcement = await announcementService.createAnnouncementService({
      title,
      content,
      expiredDate: expired_date,
      status
    });

    return res.status(201).json({
      success: true,
      data: announcement,
      message: 'Announcement created successfully.'
    });
  } catch (error) {
    const statusCode = error.status || 500;
    return res.status(statusCode).json({
      success: false,
      data: null,
      message: error.message || 'An error occurred while creating the announcement.'
    });
  }
};

/**
 * Controller to view and filter announcements for management with pagination.
 */
export const getAnnouncementsForManagementController = async (req, res) => {
  try {
    const { page, limit, status } = req.query;
    const result = await announcementService.getAnnouncementsForManagementService({
      page,
      limit,
      status
    });

    return res.status(200).json({
      success: true,
      data: result,
      message: 'Announcements fetched successfully.'
    });
  } catch (error) {
    const statusCode = error.status || 500;
    return res.status(statusCode).json({
      success: false,
      data: null,
      message: error.message || 'An error occurred while fetching announcements.'
    });
  }
};

/**
 * Controller to publish/unpublish an announcement (update status).
 */
export const updateAnnouncementStatusController = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notifyUsersAgain } = req.body;

    const updated = await announcementService.updateAnnouncementStatusService(id, status, {
      notifyUsersAgain: notifyUsersAgain === true,
    });

    return res.status(200).json({
      success: true,
      data: updated,
      message: 'Announcement status updated successfully.'
    });
  } catch (error) {
    const statusCode = error.status || 500;
    return res.status(statusCode).json({
      success: false,
      data: null,
      message: error.message || 'An error occurred while updating status.'
    });
  }
};

/**
 * Controller to edit title, content, and expiration date of an announcement.
 */
export const editAnnouncementDetailsController = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, expired_date, notifyUsersAgain } = req.body;

    const updated = await announcementService.editAnnouncementDetailsService(id, {
      title,
      content,
      expiredDate: expired_date
    }, {
      notifyUsersAgain: notifyUsersAgain === true,
    });

    return res.status(200).json({
      success: true,
      data: updated,
      message: 'Announcement details updated successfully.'
    });
  } catch (error) {
    const statusCode = error.status || 500;
    return res.status(statusCode).json({
      success: false,
      data: null,
      message: error.message || 'An error occurred while updating details.'
    });
  }
};

/**
 * Controller to delete an announcement.
 */
export const deleteAnnouncementController = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await announcementService.deleteAnnouncementService(id);

    return res.status(200).json({
      success: true,
      data: deleted,
      message: 'Announcement deleted successfully.'
    });
  } catch (error) {
    const statusCode = error.status || 500;
    return res.status(statusCode).json({
      success: false,
      data: null,
      message: error.message || 'An error occurred while deleting the announcement.'
    });
  }
};

/**
 * Controller for users/guests to view active, non-expired announcements on homepage.
 */
export const getActiveAnnouncementsController = async (req, res) => {
  try {
    const activeAnnouncements = await announcementService.getActiveAnnouncementsService();
    return res.status(200).json({
      success: true,
      data: activeAnnouncements,
      message: 'Active announcements fetched successfully.'
    });
  } catch (error) {
    const statusCode = error.status || 500;
    return res.status(statusCode).json({
      success: false,
      data: null,
      message: error.message || 'An error occurred while fetching active announcements.'
    });
  }
};

/**
 * Controller to retrieve a single announcement by ID.
 */
export const getAnnouncementByIdController = async (req, res) => {
  try {
    const { id } = req.params;
    const announcement = await announcementService.getAnnouncementByIdService(id);
    return res.status(200).json({
      success: true,
      data: announcement,
      message: 'Announcement details fetched successfully.'
    });
  } catch (error) {
    const statusCode = error.status || 500;
    return res.status(statusCode).json({
      success: false,
      data: null,
      message: error.message || 'An error occurred while fetching the announcement details.'
    });
  }
};
