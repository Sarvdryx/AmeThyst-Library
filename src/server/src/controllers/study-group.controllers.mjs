import * as service from '../services/study-group.services.mjs';
import { emitStudyGroupChanged, emitUserNotification } from '../config/socket.mjs';

export const sendData = (res, data, status = 200, meta) =>
  res.status(status).json({ success: true, data, ...(meta ? { meta } : {}) });

export const sendMessage = (res, message, status = 200) =>
  res.status(status).json({ success: true, message });

export const sendStudyGroupError = (res, error) => res.status(error.status || 500).json({
  success: false,
  error: {
    code: error.code || 'INTERNAL_ERROR',
    message: error.message || 'An unexpected error occurred.',
    ...(error.details ? { details: error.details } : {}),
    ...(error.retryAt ? { retryAt: error.retryAt } : {}),
  },
});

export const currentUserId = (req) => req.user?.userId || null;

const action = (handler) => async (req, res) => {
  try { await handler(req, res); } catch (error) { sendStudyGroupError(res, error); }
};

const emitNotifications = async (notifications = [], groupId) => {
  for (const envelope of notifications) {
    if (envelope && envelope.recipientId && envelope.notification) {
      emitUserNotification(envelope.recipientId, envelope.notification);
    }
  }
  if (groupId) {
    emitStudyGroupChanged(groupId, 'updated');
  }
};

export const createStudyGroupController = action(async (req, res) => {
  const data = await service.createStudyGroup(currentUserId(req), req.body);
  emitStudyGroupChanged(data.groupId, 'created');
  sendData(res, data, 201);
});
export const listStudyGroupsController = action(async (req, res) => { const result = await service.discoverGroups(currentUserId(req), req.studyGroupQuery || req.query); sendData(res, result.data, 200, result.meta); });
export const listCreatedStudyGroupsController = action(async (req, res) => { const result = await service.getCreatedGroups(currentUserId(req), req.studyGroupQuery || req.query); sendData(res, result.data, 200, result.meta); });
export const listJoinedStudyGroupsController = action(async (req, res) => { const result = await service.getJoinedGroups(currentUserId(req), req.studyGroupQuery || req.query); sendData(res, result.data, 200, result.meta); });
export const listStudyGroupInvitationsController = action(async (req, res) => sendData(res, await service.getPendingInvitations(currentUserId(req))));
export const getStudyGroupController = action(async (req, res) => sendData(res, await service.getDetail(req.params.groupId, currentUserId(req))));

export const updateStudyGroupController = action(async (req, res) => {
  const { notifications, ...detail } = await service.editStudyGroup(req.params.groupId, currentUserId(req), req.body);
  await emitNotifications(notifications, req.params.groupId);
  sendData(res, detail);
});

export const requestToJoinController = action(async (req, res) => {
  const { notifications, participation } = await service.submitJoinRequest(req.params.groupId, currentUserId(req), req.body.content);
  await emitNotifications(notifications, req.params.groupId);
  sendData(res, participation, 201);
});

export const approveJoinRequestController = action(async (req, res) => {
  const { notifications, group, participation } = await service.approveRequest(req.params.groupId, req.params.requestId, currentUserId(req));
  await emitNotifications(notifications, req.params.groupId);
  sendData(res, { group, participation });
});

export const denyJoinRequestController = action(async (req, res) => {
  const { notifications, group, participation } = await service.denyRequest(req.params.groupId, req.params.requestId, currentUserId(req));
  await emitNotifications(notifications, req.params.groupId);
  sendData(res, { group, participation });
});

export const cancelJoinRequestController = action(async (req, res) => {
  const envelope = await service.cancelRequest(
    req.params.groupId,
    req.params.requestId,
    currentUserId(req),
  );
  if (envelope.recipientId && envelope.notification) {
    emitUserNotification(envelope.recipientId, envelope.notification);
  }
  emitStudyGroupChanged(req.params.groupId, 'updated');
  sendMessage(res, 'Join request cancelled.');
});

export const removeStudyGroupMemberController = action(async (req, res) => {
  const { notifications, detail } = await service.removeMember(req.params.groupId, req.params.userId, currentUserId(req));
  await emitNotifications(notifications, req.params.groupId);
  sendData(res, detail);
});

export const leaveStudyGroupController = action(async (req, res) => {
  const { notifications, ...rest } = await service.leaveGroup(req.params.groupId, currentUserId(req));
  await emitNotifications(notifications, req.params.groupId);
  sendMessage(res, 'You left the Study Group.');
});

export const dissolveStudyGroupController = action(async (req, res) => {
  const { notifications, ...rest } = await service.dissolveStudyGroup(req.params.groupId, currentUserId(req));
  await emitNotifications(notifications);
  emitStudyGroupChanged(req.params.groupId, 'dissolved');
  sendData(res, { groupId: rest.groupId, deleted: rest.deleted });
});

export const inviteStudyGroupMemberController = action(async (req, res) => {
  const data = await service.inviteMember(req.params.groupId, currentUserId(req), req.body);
  emitStudyGroupChanged(req.params.groupId, 'invitation-created');
  sendData(res, data, 201);
});

export const acceptStudyGroupInvitationController = action(async (req, res) => {
  const { notifications, group, participation } = await service.acceptInvitation(req.params.groupId, req.params.requestId, currentUserId(req));
  await emitNotifications(notifications, req.params.groupId);
  sendData(res, { group, participation });
});

export const denyStudyGroupInvitationController = action(async (req, res) => {
  const { notifications, participation } = await service.denyInvitation(req.params.groupId, req.params.requestId, currentUserId(req));
  await emitNotifications(notifications, req.params.groupId);
  sendData(res, { participation });
});
