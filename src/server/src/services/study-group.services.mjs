import * as model from '../models/study-group.models.mjs';
import {
  sendStudyGroupDissolvedEmail,
  sendStudyGroupInvitationEmail,
  sendStudyGroupMemberJoinedEmail,
  sendStudyGroupMemberLeftEmail,
  sendStudyGroupRemovalEmail,
  sendStudyGroupRequestApprovedEmail,
  sendStudyGroupRequestDeniedEmail,
  sendStudyGroupRequestSubmittedEmail,
} from '../utils/mailer.mjs';
import { saveNotification } from './notification.services.mjs';

const lifecycleNotification = (type, groupId, details) => ({
  id: details.eventId || `${type}:${groupId}:${Date.now()}`,
  type,
  groupId,
  createdAt: new Date().toISOString(),
  ...(details.memberName ? { memberName: details.memberName } : {}),
  ...(details.actor ? { actor: details.actor } : {}),
  ...(details.changedFields ? { changedFields: details.changedFields } : {}),
  ...(details.destination ? { destination: details.destination } : {}),
  group: {
    title: details.title,
    subject: details.subject,
    currentMembers: details.currentMembers,
    capacity: details.capacity,
    date: details.reservation?.startDate || details.date,
    startTime: details.reservation?.startTime || details.startTime || details.time?.split(' - ')[0],
    endTime: details.reservation?.endTime || details.endTime || details.time?.split(' - ')[1],
    roomName: details.reservation?.room?.roomName || details.roomName,
    branchName: details.reservation?.room?.branchName || details.branchName,
    roomId: details.reservation?.room?.roomId || details.roomId,
    branchId: details.reservation?.room?.branchId || details.branchId,
  },
});

const persistLifecycleNotification = async (client, recipientId, type, groupId, details) => {
  if (!recipientId) return null;
  const notification = lifecycleNotification(type, groupId, details);
  const saved = await saveNotification(
    recipientId,
    notification.type || 'notification',
    notification.id,
    notification,
    false,
    client,
  );
  const savedPayload = saved?.payload && typeof saved.payload === 'object'
    ? saved.payload
    : notification;
  return {
    recipientId,
    notification: {
      ...savedPayload,
      id: notification.id,
      type: notification.type,
      groupId: notification.groupId,
      createdAt: saved?.created_at
        ? new Date(saved.created_at).toISOString()
        : notification.createdAt,
    },
  };
};

export class StudyGroupError extends Error {
  constructor(code, message, status = 400, details, retryAt) {
    super(message);
    this.name = 'StudyGroupError';
    this.code = code;
    this.status = status;
    this.details = details;
    this.retryAt = retryAt;
  }
}

export const normalizeRequirements = (requirements = []) =>
  requirements.map((item) => String(item).trim()).filter(Boolean);

export const normalizeMetadata = (input = {}) => ({
  title: typeof input.title === 'string' ? input.title.trim() : input.title,
  description: typeof input.description === 'string' ? input.description.trim() : input.description,
  subject: typeof input.subject === 'string' ? input.subject.trim() : input.subject,
  requirements: normalizeRequirements(input.requirements),
});

const fail = (code, message, status = 400, details, retryAt) => {
  throw new StudyGroupError(code, message, status, details, retryAt);
};

const lifecycleEmailDetails = (summary) => ({
  groupId: summary.groupId,
  title: summary.title,
  subject: summary.subject,
  currentMembers: summary.currentMembers,
  capacity: summary.capacity,
  date: summary.reservation.startDate,
  time: `${summary.reservation.startTime} - ${summary.reservation.endTime}`,
  roomName: summary.reservation.room.roomName,
  branchName: summary.reservation.room.branchName,
  roomId: summary.reservation.room.roomId,
  branchId: summary.reservation.room.branchId,
});

const notificationActor = (user = {}) => ({
  userId: user.userId || null,
  username: user.username || 'Unknown',
  email: user.email || null,
  avatar: user.avatar || null,
});

const sendLifecycleEmailSafely = async (send, recipient, details, event) => {
  if (!recipient?.email) return;
  try {
    await send(recipient.email, details);
  } catch (error) {
    console.error(`Study Group ${event} email failed for user ${recipient.userId}:`, error);
  }
};

export const parsePagination = (query = {}) => ({ page: Number(query.page || 1), pageSize: Number(query.pageSize || 8) });

export const denialRetryAt = (participation) => {
  if (!participation || participation.type !== 'request' || participation.status !== 'denied' || !participation.decidedAt) return null;
  return new Date(new Date(participation.decidedAt).getTime() + 30 * 60 * 1000);
};

const VIETNAM_UTC_OFFSET = '+07:00';
const DISSOLVE_CUTOFF_MS = 3 * 60 * 60 * 1000;

const reservationDate = (value) => {
  if (!(value instanceof Date)) return String(value).slice(0, 10);
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(value);
};

const vietnamReservationInstant = (date, time) =>
  new Date(`${reservationDate(date)}T${time}${VIETNAM_UTC_OFFSET}`);

export const canDissolveBeforeStart = (row, now = new Date()) => {
  const startDate =
    row.start_date ?? row.startDate ?? row.reservation?.startDate;
  const startTime =
    row.start_time ?? row.startTime ?? row.reservation?.startTime;

  if (!startDate || !startTime) return false;

  const start = vietnamReservationInstant(startDate, startTime);
  return (
    Number.isFinite(start.getTime()) &&
    now.getTime() <= start.getTime() - DISSOLVE_CUTOFF_MS
  );
};

export const canLeaveBeforeStart = (row, now = new Date()) =>
  canDissolveBeforeStart(row, now);

export const effectiveStatus = (row, now = new Date()) => {
  const reservationStatus = row.reservation_status || row.reservationStatus;
  if (reservationStatus === 'cancelled' || row.status === 'cancelled') return 'cancelled';
  if (row.status === 'expired') return 'expired';
  if (row.status === 'completed') return 'completed';
  const startDate = row.start_date ?? row.startDate;
  const startTime = row.start_time ?? row.startTime;
  const endTime = row.end_time ?? row.endTime;
  const start = vietnamReservationInstant(startDate, startTime);
  const end = vietnamReservationInstant(startDate, endTime);
  if (reservationStatus === 'used' && now >= end) return 'completed';
  if (reservationStatus !== 'used' && now >= start) return 'expired';
  if (reservationStatus === 'used' && now >= start) return 'inprogress';
  const currentMembers = row.current_num ?? row.currentMembers;
  return Number(currentMembers) >= Number(row.capacity) ? 'full' : 'upcoming';
};

const participationFromRow = (row) => row.participationRequestId ? {
  requestId: row.participationRequestId,
  groupId: row.groupId,
  user: { userId: row.currentUserId || '', username: row.currentUserUsername || '', avatar: null },
  content: row.participationContent || null,
  type: row.participationType || 'request',
  status: row.participationStatus,
  createdAt: row.participationCreatedAt,
  decidedAt: row.participationDecidedAt || null,
} : null;

export const projectSummary = (row, currentUserId = null) => {
  const participation = participationFromRow({ ...row, currentUserId });
  const groupStatus = effectiveStatus(row);
  if (participation && ['expired', 'completed', 'cancelled'].includes(groupStatus) && ['pending', 'approved'].includes(participation.status)) participation.status = 'expired';
  const retryDate = denialRetryAt(participation);
  const retryAt = retryDate?.toISOString() || null;
  return {
    groupId: row.groupId,
    subject: row.subject,
    title: row.title,
    description: row.description || '',
    requirements: row.requirements || [],
    host: {
      userId: row.hostUserId,
      username: row.hostUsername,
      avatar: row.hostAvatar || null,
      role: row.hostRole || null,
      occupation: row.hostOccupation || null,
      hometown: row.hostHometown || null,
      description: row.hostDescription || null,
    },
    reservation: {
      reserveId: row.reserveId, startDate: row.startDate, startTime: row.startTime, endTime: row.endTime,
      status: row.reservationStatus,
      room: { roomId: row.roomId, roomName: row.roomName, branchId: row.branchId, branchName: row.branchName, capacity: row.roomCapacity, imageUrl: row.imageUrl || null },
    },
    capacity: row.capacity,
    currentMembers: row.currentMembers,
    status: groupStatus,
    pendingCount: row.pendingCount || 0,
    isHost: Boolean(currentUserId && currentUserId === row.hostUserId),
    currentUserParticipation: participation,
    canJoin: Boolean(currentUserId && currentUserId !== row.hostUserId && groupStatus === 'upcoming' && row.currentMembers < row.capacity && !['pending', 'approved'].includes(participation?.status) && (!retryAt || Date.now() >= new Date(retryAt).getTime())),
    retryAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
};

const projectProfileUser = (row = {}) => ({
  userId: row.userId || row.user_id,
  username: row.username || '',
  avatar: row.avatar || null,
  role: row.role || null,
  email: row.email || null,
  phoneNumber: row.phoneNumber || row.phone_number || null,
  birthDate: row.birthDate || row.birth_date || null,
  gender: row.gender || null,
  occupation: row.occupation || null,
  hometown: row.hometown || null,
  description: row.description || null,
});

const projectParticipation = (row) => ({
  requestId: row.requestId || row.request_id,
  groupId: row.groupId || row.group_id,
  user: projectProfileUser(row),
  content: row.content || null,
  type: row.type || 'request',
  status: row.status,
  createdAt: row.createdAt || row.created_at,
  decidedAt: row.decidedAt || row.decidedAtUtc || row.decided_at || null,
});

const permissions = (summary, userId) => {
  const host = summary.host.userId === userId;
  const manageable = ['upcoming', 'full'].includes(summary.status);
  return {
    canEdit: host && manageable,
    canApprove: host && summary.status === 'upcoming' && summary.currentMembers < summary.capacity,
    canDeny: host && manageable,
    canRemove: host && manageable,
    canDissolve: host && manageable && canDissolveBeforeStart(summary),
    canLeave: !host && manageable && canLeaveBeforeStart(summary) && summary.currentUserParticipation?.status === 'approved',
    canCancelRequest: !host && manageable && summary.currentUserParticipation?.type === 'request' && summary.currentUserParticipation.status === 'pending',
  };
};

export const getDetail = async (groupId, userId = null, client) => {
  const record = await model.findGroupDetail(groupId, userId, client);
  if (!record) fail('NOT_FOUND', 'Study Group not found.', 404);
  const summary = projectSummary(record.summary, userId);
  const visibleManagement = summary.host.userId === userId;
  const visibleMembers = true;
  return {
    ...summary,
    organizerProfile: projectProfileUser(record.organizer),
    approvedMembers: visibleMembers ? record.requests.filter((item) => item.status === 'approved').map(projectParticipation) : [],
    pendingRequests: visibleManagement ? record.requests.filter((item) => item.type === 'request' && item.status === 'pending').map(projectParticipation) : [],
    permissions: permissions(summary, userId),
  };
};

const pageResult = (result, page, pageSize, map) => ({
  data: result.rows.map(map),
  meta: { page, pageSize, totalItems: result.total, totalPages: Math.ceil(result.total / pageSize) },
});

export const createStudyGroup = async (userId, input) => {
  const metadata = normalizeMetadata(input);
  if (!userId) fail('UNAUTHORIZED', 'Authentication required.', 401);
  if (!metadata.title || !metadata.description || !metadata.subject || !/\p{L}/u.test(metadata.title) || !/\p{L}/u.test(metadata.subject) || metadata.requirements.length > 5) fail('VALIDATION_ERROR', 'Valid title, description, subject, and up to five optional requirements are required.');
  try {
    return await model.withTransaction(async (client) => {
      const slot = await model.findSlotForCreation(input.availId, input.startDate, client);
      if (!slot) fail('NOT_FOUND', 'Room availability slot not found.', 404);
      if (slot.capacity < 1) fail('INVALID_CAPACITY', 'The selected room cannot host a Study Group.', 409);
      if (slot.occupied) fail('SLOT_UNAVAILABLE', 'This room slot is no longer available.', 409);
      const reservation = await model.insertReservation({ userId, availId: input.availId, startDate: input.startDate }, client);
      const group = await model.insertStudyGroup({ userId, reserveId: reservation.reserveId, ...metadata, capacity: slot.capacity }, client);
      return getDetail(group.groupId, userId, client);
    });
  } catch (error) {
    if (error.code === '23505') fail('SLOT_UNAVAILABLE', 'This room slot is no longer available.', 409);
    if (error.code === '23503' && error.constraint === 'fk_reserve_user') fail('AUTH_USER_NOT_FOUND', 'Your account is no longer available. Please sign in again.', 401);
    throw error;
  }
};

export const getCreatedGroups = async (userId, query = {}) => {
  if (!userId) fail('UNAUTHORIZED', 'Authentication required.', 401);
  const { page, pageSize } = parsePagination(query);
  const result = await model.listCreatedGroups({ userId, page, pageSize });
  return pageResult(result, page, pageSize, (row) => projectSummary(row, userId));
};

export const discoverGroups = async (userId, query = {}) => {
  const { page, pageSize } = parsePagination(query);
  const result = await model.listDiscoverableGroups({
    currentUserId: userId, page, pageSize, search: query.search, subject: query.subject,
    date: query.date, startTime: query.startTime, endTime: query.endTime,
    branchIds: query.branchIds, roomIds: query.roomIds, sort: query.sort,
  });
  return pageResult(result, page, pageSize, (row) => projectSummary(row, userId));
};

export const getJoinedGroups = async (userId, query = {}) => {
  if (!userId) fail('UNAUTHORIZED', 'Authentication required.', 401);
  const { page, pageSize } = parsePagination(query);
  const result = await model.listJoinedGroups({ userId, page, pageSize });
  return pageResult(result, page, pageSize, (row) => {
    const group = projectSummary(row, userId);
    const participation = participationFromRow({ ...row, currentUserId: userId });
    if (participation && ['expired', 'completed', 'cancelled'].includes(group.status) && ['pending', 'approved'].includes(participation.status)) participation.status = 'expired';
    return { group, participation };
  });
};

const requireManageableHost = (group, userId, allowFull = true) => {
  if (!group) fail('NOT_FOUND', 'Study Group not found.', 404);
  if (group.created_by !== userId) fail('FORBIDDEN', 'Only the host may perform this action.', 403);
  const status = effectiveStatus(group);
  if (status !== 'upcoming' && !(allowFull && status === 'full')) fail('STALE_STATE', 'The group is no longer manageable.', 409);
  return status;
};

export const editStudyGroup = async (groupId, userId, input) => model.withTransaction(async (client) => {
  const group = await model.lockGroup(groupId, client);
  requireManageableHost(group, userId);
  const metadata = normalizeMetadata(input);
  if (input.requirements === undefined) metadata.requirements = undefined;
  if (metadata.requirements && metadata.requirements.length > 5) fail('VALIDATION_ERROR', 'Requirements must contain at most five items.');
  if (metadata.title !== undefined && (!metadata.title || !/\p{L}/u.test(metadata.title))) fail('VALIDATION_ERROR', 'Title must contain at least one letter.');
  if (metadata.subject !== undefined && (!metadata.subject || !/\p{L}/u.test(metadata.subject))) fail('VALIDATION_ERROR', 'Subject must contain at least one letter.');
  const changedFields = ['title', 'description', 'subject', 'requirements'].filter((field) => {
    if (input[field] === undefined) return false;
    if (field === 'requirements') return JSON.stringify(metadata.requirements || []) !== JSON.stringify(group.requirements || []);
    return metadata[field] !== group[field];
  });
  const updateResult = await model.updateGroupMetadata(groupId, metadata, client);
  const detail = await getDetail(groupId, userId, client);
  const recipients = changedFields.length ? await model.listApprovedNotificationRecipients(groupId, userId, client) : [];
  
  const notificationDetails = {
    ...lifecycleEmailDetails(detail),
    actor: notificationActor(detail.organizerProfile),
    changedFields,
    eventId: `group_updated:${groupId}:${new Date(updateResult.notificationEventAt).toISOString()}`,
    destination: { mode: 'joined', groupId },
  };
  
  const notifications = [];
  for (const recipient of recipients) {
    const notif = await persistLifecycleNotification(client, recipient.userId, 'group_updated', groupId, notificationDetails);
    if (notif) notifications.push(notif);
  }

  return {
    ...detail,
    notifications,
    notificationDetails
  };
});

export const approveRequest = async (groupId, requestId, userId) => {
  const result = await model.withTransaction(async (client) => {
    const group = await model.lockGroup(groupId, client);
    const status = requireManageableHost(group, userId, false);
    if (status !== 'upcoming' || group.current_num >= group.capacity) fail('GROUP_FULL', 'The group has no available capacity.', 409);
    const request = await model.lockRequest(groupId, requestId, client);
    if (!request || request.status !== 'pending' || request.type !== 'request') fail('STALE_STATE', 'The request is no longer pending.', 409);
    if (request.user_id === userId) fail('FORBIDDEN', 'Hosts cannot approve themselves.', 403);
    const requester = await model.findNotificationUser(request.user_id, client);
    const creator = await model.findGroupCreatorNotificationUser(groupId, client);
    const participation = await model.setRequestStatus(requestId, 'request', 'pending', 'approved', client);
    const updated = await model.reconcileMemberCount(groupId, 1, client);
    if (!updated) fail('GROUP_FULL', 'The group has no available capacity.', 409);
    const groupDetail = await getDetail(groupId, userId, client);
    
    const requesterDetails = {
      ...lifecycleEmailDetails(groupDetail),
      actor: notificationActor(groupDetail.organizerProfile),
      eventId: `join_request_approved:${requestId}`,
      destination: { mode: 'joined', groupId },
    };
    const creatorDetails = {
      ...lifecycleEmailDetails(groupDetail),
      actor: notificationActor(requester),
      memberName: requester?.username || 'A member',
      eventId: `member_joined:${requestId}`,
      destination: { mode: 'created', groupId },
    };
    
    const notifications = [];
    const notif1 = await persistLifecycleNotification(client, requester?.userId, 'join_request_approved', groupId, requesterDetails);
    if (notif1) notifications.push(notif1);
    const notif2 = await persistLifecycleNotification(client, creator?.userId, 'member_joined', groupId, creatorDetails);
    if (notif2) notifications.push(notif2);

    return { group: groupDetail, participation: projectParticipation(participation), requester, creator, requesterDetails, creatorDetails, notifications };
  });

  Promise.all([
    sendLifecycleEmailSafely(sendStudyGroupRequestApprovedEmail, result.requester, result.requesterDetails, 'request-approved'),
    sendLifecycleEmailSafely(sendStudyGroupMemberJoinedEmail, result.creator, result.creatorDetails, 'member-joined'),
  ]).catch(() => {});
  return {
    group: result.group,
    participation: result.participation,
    notifications: result.notifications
  };
};

export const denyRequest = async (groupId, requestId, userId) => {
  const result = await model.withTransaction(async (client) => {
    const group = await model.lockGroup(groupId, client);
    requireManageableHost(group, userId);
    const request = await model.lockRequest(groupId, requestId, client);
    if (!request || request.status !== 'pending' || request.type !== 'request') fail('STALE_STATE', 'The request is no longer pending.', 409);
    const requester = await model.findNotificationUser(request.user_id, client);
    const participation = await model.setRequestStatus(requestId, 'request', 'pending', 'denied', client);
    const groupDetail = await getDetail(groupId, userId, client);
    
    const details = {
      ...lifecycleEmailDetails(groupDetail),
      actor: notificationActor(groupDetail.organizerProfile),
      eventId: `join_request_denied:${requestId}`,
      destination: { mode: 'dashboard' },
    };
    
    const notifications = [];
    const notif = await persistLifecycleNotification(client, requester?.userId, 'join_request_denied', groupId, details);
    if (notif) notifications.push(notif);

    return { group: groupDetail, participation: projectParticipation(participation), requester, details, notifications };
  });
  
  sendLifecycleEmailSafely(sendStudyGroupRequestDeniedEmail, result.requester, result.details, 'request-denied').catch(() => {});
  return {
    group: result.group,
    participation: result.participation,
    notifications: result.notifications
  };
};

export const removeMember = async (groupId, memberId, userId) => {
  const result = await model.withTransaction(async (client) => {
    const group = await model.lockGroup(groupId, client);
    requireManageableHost(group, userId);
    if (memberId === userId) fail('FORBIDDEN', 'The host cannot remove themselves.', 403);
    const recipient = await model.findGroupNotificationUser(groupId, memberId, client);
    const removed = await model.deleteApprovedMembership(groupId, memberId, client);
    if (!removed) fail('NOT_FOUND', 'Approved member not found.', 404);
    await model.reconcileMemberCount(groupId, -1, client);
    const detail = await getDetail(groupId, userId, client);
    
    const notificationDetails = {
      ...lifecycleEmailDetails(detail),
      actor: notificationActor(detail.organizerProfile),
      eventId: `member_removed:${removed.request_id}`,
      destination: { mode: 'dashboard' },
    };
    
    const notifications = [];
    const notif = await persistLifecycleNotification(client, memberId, 'member_removed', groupId, notificationDetails);
    if (notif) notifications.push(notif);

    return { detail, recipient, membershipId: removed.request_id, notificationDetails, notifications };
  });
  
  sendLifecycleEmailSafely(sendStudyGroupRemovalEmail, result.recipient, result.notificationDetails, 'member-removal').catch(() => {});
  return { detail: result.detail, notificationDetails: result.notificationDetails, notifications: result.notifications };
};

export const submitJoinRequest = async (groupId, userId, content) => {
  const result = await model.withTransaction(async (client) => {
    const group = await model.lockGroup(groupId, client);
    if (!group) fail('NOT_FOUND', 'Study Group not found.', 404);
    if (group.created_by === userId) fail('FORBIDDEN', 'Hosts cannot join their own group.', 403);
    if (effectiveStatus(group) !== 'upcoming' || group.current_num >= group.capacity) fail('GROUP_FULL', 'This group is not accepting requests.', 409);
    const latest = await model.findLatestParticipation(groupId, userId, client);
    if (latest && ['pending', 'approved'].includes(latest.status)) fail('DUPLICATE_PARTICIPATION', 'You already have an active relationship with this group.', 409);
    const retryAt = denialRetryAt(latest ? { type: latest.type, status: latest.status, decidedAt: latest.decidedAtUtc || latest.createdAtUtc || latest.decided_at || latest.created_at } : null);
    if (retryAt && Date.now() < retryAt.getTime()) fail('COOLDOWN_ACTIVE', 'You can request again after the cooldown.', 409, undefined, retryAt.toISOString());
    await model.deleteDeniedParticipations(groupId, userId, client);
    try {
      const participation = projectParticipation(await model.insertJoinRequest({ groupId, userId, content }, client));
      const requester = await model.findNotificationUser(userId, client);
      const creator = await model.findGroupCreatorNotificationUser(groupId, client);
      const detail = await getDetail(groupId, userId, client);
      
      const details = {
        ...lifecycleEmailDetails(detail),
        actor: notificationActor(requester),
        requestId: participation.requestId,
        eventId: `join_request_submitted:${participation.requestId}`,
        destination: { mode: 'created', groupId },
      };
      
      const notifications = [];
      const notif = await persistLifecycleNotification(client, creator?.userId, 'join_request_submitted', groupId, details);
      if (notif) notifications.push(notif);
      
      return {
        participation,
        requester,
        creator,
        detail,
        details,
        notifications
      };
    } catch (error) {
      if (error.code === '23505') fail('DUPLICATE_PARTICIPATION', 'A request already exists.', 409);
      throw error;
    }
  });
  
  sendLifecycleEmailSafely(sendStudyGroupRequestSubmittedEmail, result.creator, result.details, 'request-submitted').catch(() => {});
  return {
    participation: result.participation,
    notifications: result.notifications
  };
};

export const cancelRequest = async (groupId, requestId, userId) =>
  model.withTransaction(async (client) => {
    const group = await model.lockGroup(groupId, client);
    if (!group || !['upcoming', 'full'].includes(effectiveStatus(group))) fail('STALE_STATE', 'The request can no longer be cancelled.', 409);
    const detail = await getDetail(groupId, userId, client);
    const requester = await model.findNotificationUser(userId, client);
    const creator = await model.findGroupCreatorNotificationUser(groupId, client);
    const removed = await model.deletePendingRequest(groupId, requestId, userId, client);
    if (!removed) fail('STALE_STATE', 'The request is no longer pending.', 409);
    const details = {
      ...lifecycleEmailDetails(detail),
      actor: notificationActor(requester),
      eventId: `join_request_cancelled:${requestId}`,
      destination: { mode: 'created', groupId },
    };
    return await persistLifecycleNotification(
      client,
      creator?.userId,
      'join_request_cancelled',
      groupId,
      details,
    ) || { recipientId: null, notification: null };
  });

export const getPendingInvitations = async (userId) => {
  if (!userId) fail('UNAUTHORIZED', 'Authentication required.', 401);
  const rows = await model.listPendingInvitations(userId);
  return rows.map((row) => ({
    requestId: row.requestId,
    content: row.content || null,
    invitedAt: row.invitedAt,
    actor: {
      userId: row.hostUserId,
      username: row.hostUsername,
      email: row.actorEmail || null,
      avatar: row.hostAvatar || null,
    },
    group: projectSummary(row, userId),
  }));
};

export const inviteMember = async (groupId, hostUserId, input) => {
  const email = String(input?.email || '').trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email)) fail('VALIDATION_ERROR', 'A valid email address is required.');
  const created = await model.withTransaction(async (client) => {
    const group = await model.lockGroup(groupId, client);
    const status = requireManageableHost(group, hostUserId, false);
    if (status !== 'upcoming' || group.current_num >= group.capacity) fail('GROUP_FULL', 'The group has no available capacity.', 409);
    const recipient = await model.findUserByEmail(email, client);
    if (!recipient) fail('USER_NOT_FOUND', 'Please check the email and try again. There is no registered account with this email address.', 404);
    if (recipient.role !== 'user') fail('INELIGIBLE_INVITEE', 'Only user accounts can be invited to a Study Group.', 403);
    if (recipient.userId === hostUserId) fail('FORBIDDEN', 'Hosts cannot invite themselves.', 403);
    const latest = await model.findLatestParticipation(groupId, recipient.userId, client);
    if (latest && ['pending', 'approved'].includes(latest.status)) fail('DUPLICATE_PARTICIPATION', 'This user already has an active relationship with the group.', 409);
    try {
      const invitation = await model.insertInvitation({ groupId, userId: recipient.userId, content: input?.message }, client);
      return { invitation, recipient, detail: await getDetail(groupId, hostUserId, client) };
    } catch (error) {
      if (error.code === '23505') fail('DUPLICATE_PARTICIPATION', 'An active invitation or participation already exists.', 409);
      throw error;
    }
  });
  const summary = created.detail;
  try {
    await sendStudyGroupInvitationEmail(created.recipient.email, {
      requestId: created.invitation.requestId,
      title: summary.title,
      subject: summary.subject,
      hostName: summary.host.username,
      date: summary.reservation.startDate,
      time: `${summary.reservation.startTime} - ${summary.reservation.endTime}`,
      roomName: summary.reservation.room.roomName,
      branchName: summary.reservation.room.branchName,
      actor: notificationActor(summary.organizerProfile),
    });
  } catch (error) {
    try {
      await model.deletePendingInvitation(created.invitation.requestId);
    } catch (cleanupError) {
      console.error('Invitation email delivery failed:', error);
      console.error('Invitation cleanup also failed:', cleanupError);
      fail('INVITATION_STATE_INCONSISTENT', 'The invitation email could not be delivered and cleanup failed.', 503);
    }
    console.error('Invitation email delivery failed:', error);
    fail('EMAIL_DELIVERY_FAILED', 'The invitation email could not be delivered.', 502);
  }
  return { invitation: projectParticipation(created.invitation), group: summary };
};

const decideInvitation = async (groupId, requestId, userId, decision) => model.withTransaction(async (client) => {
  const group = await model.lockGroup(groupId, client);
  if (!group) fail('NOT_FOUND', 'Study Group not found.', 404);
  if (!['upcoming', 'full'].includes(effectiveStatus(group))) fail('STALE_STATE', 'This invitation is no longer actionable.', 409);
  const request = await model.lockRequest(groupId, requestId, client);
  if (!request || request.type !== 'invite' || request.status !== 'pending') fail('STALE_STATE', 'This invitation is no longer pending.', 409);
  if (request.user_id !== userId) fail('FORBIDDEN', 'Only the invited user may respond.', 403);
  const invitee = await model.findNotificationUser(userId, client);
  const creator = await model.findGroupCreatorNotificationUser(groupId, client);
  if (decision === 'approved') {
    if (effectiveStatus(group) !== 'upcoming' || group.current_num >= group.capacity) fail('GROUP_FULL', 'The group has no available capacity.', 409);
    const participation = await model.setRequestStatus(requestId, 'invite', 'pending', 'approved', client);
    const updated = await model.reconcileMemberCount(groupId, 1, client);
    if (!updated) fail('GROUP_FULL', 'The group has no available capacity.', 409);
    const memberDetail = await getDetail(groupId, userId, client);
    
    const details = {
      ...lifecycleEmailDetails(memberDetail),
      actor: notificationActor(invitee),
      memberName: invitee?.username || 'A member',
      eventId: `member_joined:${requestId}`,
      destination: { mode: 'created', groupId },
    };
    
    const notif = await persistLifecycleNotification(client, creator?.userId, 'member_joined', groupId, details);
    
    return {
      group: memberDetail,
      participation: projectParticipation(participation),
      creator,
      notifications: notif ? [notif] : [],
    };
  }
  const participation = await model.setRequestStatus(requestId, 'invite', 'pending', 'denied', client);
  const detail = await getDetail(groupId, userId, client);
  
  const details = {
    ...lifecycleEmailDetails(detail),
    actor: notificationActor(invitee),
    eventId: `invitation_declined:${requestId}`,
    destination: { mode: 'created', groupId },
  };
  
  const notif = await persistLifecycleNotification(client, creator?.userId, 'invitation_declined', groupId, details);
  
  return {
    groupId,
    participation: projectParticipation(participation),
    notifications: notif ? [notif] : [],
  };
});

export const acceptInvitation = async (groupId, requestId, userId) => {
  const result = await decideInvitation(groupId, requestId, userId, 'approved');
  if (result.notifications?.[0]?.recipientId) {
    sendLifecycleEmailSafely(sendStudyGroupMemberJoinedEmail, result.creator, result.notifications[0].notification.details, 'member-joined').catch(() => {});
  }
  return result;
};
export const denyInvitation = (groupId, requestId, userId) => decideInvitation(groupId, requestId, userId, 'denied');

export const leaveGroup = async (groupId, userId) => {
  const result = await model.withTransaction(async (client) => {
    const group = await model.lockGroup(groupId, client);
    if (!group) fail('NOT_FOUND', 'Study Group not found.', 404);
    if (group.created_by === userId) fail('FORBIDDEN', 'Hosts cannot leave their own group.', 403);
    if (!['upcoming', 'full'].includes(effectiveStatus(group))) fail('STALE_STATE', 'The group can no longer be left.', 409);
    if (!canLeaveBeforeStart(group)) {
      fail(
        'LEAVE_CUTOFF',
        'Study Group members can only leave at least three hours before the scheduled start time.',
        409,
      );
    }
    const detail = await getDetail(groupId, userId, client);
    const creator = await model.findGroupCreatorNotificationUser(groupId, client);
    const member = await model.findGroupNotificationUser(groupId, userId, client);
    const removed = await model.deleteApprovedMembership(groupId, userId, client);
    if (!removed) fail('NOT_FOUND', 'Approved membership not found.', 404);
    await model.reconcileMemberCount(groupId, -1, client);
    
    const details = {
      ...lifecycleEmailDetails(detail),
      memberName: member?.username || 'A member',
      actor: notificationActor(member),
      eventId: `member_left:${removed.request_id}`,
      destination: { mode: 'created', groupId },
    };
    
    const notifications = [];
    const notif = await persistLifecycleNotification(client, creator?.userId, 'member_left', groupId, details);
    if (notif) notifications.push(notif);

    return {
      creator,
      membershipId: removed.request_id,
      details,
      notifications
    };
  });
  
  sendLifecycleEmailSafely(sendStudyGroupMemberLeftEmail, result.creator, result.details, 'member-leave').catch(() => {});
  return {
    notificationRecipient: result.creator?.userId || null,
    notificationDetails: result.details,
    notifications: result.notifications
  };
};

export const dissolveStudyGroup = async (groupId, userId) => {
  const result = await model.withTransaction(async (client) => {
    const group = await model.lockGroup(groupId, client);
    requireManageableHost(group, userId);
    if (!canDissolveBeforeStart(group)) {
      fail(
        'DISSOLVE_CUTOFF',
        'Study Groups can only be dissolved at least three hours before the scheduled start time.',
        409,
      );
    }
    const detail = await getDetail(groupId, userId, client);
    const recipients = await model.listGroupNotificationRecipients(groupId, userId, client);
    const deleted = await model.dissolveGroup(group, client);
    if (!deleted) fail('STALE_STATE', 'The Study Group could not be dissolved.', 409);
    
    const details = {
      ...lifecycleEmailDetails(detail),
      actor: notificationActor(detail.organizerProfile),
      eventId: `group_dissolved:${groupId}`,
      destination: { mode: 'dashboard' },
    };
    
    const notifications = [];
    for (const recipient of recipients) {
      const notif = await persistLifecycleNotification(client, recipient.userId, 'group_dissolved', groupId, details);
      if (notif) notifications.push(notif);
    }
    
    return {
      groupId,
      deleted,
      recipients,
      details,
      notifications
    };
  });
  
  for (const recipient of result.recipients) {
    sendLifecycleEmailSafely(sendStudyGroupDissolvedEmail, recipient, result.details, 'group-dissolve').catch(() => {});
  }
  return {
    groupId: result.groupId,
    deleted: result.deleted,
    notificationRecipients: result.recipients.map((r) => r.userId),
    notificationDetails: result.details,
    notifications: result.notifications
  };
};
