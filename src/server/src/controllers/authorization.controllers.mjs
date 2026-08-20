import * as authorizationService from '../services/authorization.services.mjs';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const assertUserId = (userId) => {
  if (!UUID_PATTERN.test(String(userId || ''))) {
    const error = new Error('User ID must be a valid UUID.');
    error.code = 'INVALID_USER_ID';
    error.status = 400;
    throw error;
  }
};

const fail = (res, err) => {
  const statusCode = err.status || 500;
  return res.status(statusCode).json({
    success: false,
    error: { code: err.code || 'INTERNAL_ERROR', message: err.message || 'An unexpected error occurred.' },
  });
};

export const getUsers = async (req, res) => {
  try {
    const { search, role, status, page, limit } = req.query;
    const data = await authorizationService.listUsersForManagementService({
      actor: req.user,
      search,
      role,
      status,
      page,
      limit,
    });
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return fail(res, err);
  }
};

export const promote = async (req, res) => {
  try {
    const { userId } = req.params;
    assertUserId(userId);
    const { targetRole, branchId, sudoPassword } = req.body;
    const data = await authorizationService.promoteUserService({
      actor: req.user,
      userId,
      targetRole,
      branchId,
      sudoPassword,
    });
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return fail(res, err);
  }
};

export const demote = async (req, res) => {
  try {
    const { userId } = req.params;
    assertUserId(userId);
    const { targetRole, branchId, sudoPassword } = req.body;
    const data = await authorizationService.demoteUserService({
      actor: req.user,
      userId,
      targetRole,
      branchId,
      sudoPassword,
    });
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return fail(res, err);
  }
};

export const inviteAdmin = async (req, res) => {
  try {
    const { email, sudoPassword } = req.body;
    const data = await authorizationService.inviteAdminService({
      actor: req.user,
      email,
      sudoPassword,
    });
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return fail(res, err);
  }
};

export const getHistory = async (req, res) => {
  try {
    const { action, page, limit } = req.query;
    const data = await authorizationService.getHistoryService({ action, page, limit });
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return fail(res, err);
  }
};
