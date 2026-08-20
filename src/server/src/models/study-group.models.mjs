import pool from '../config/postgres.mjs';

export const ACTIVE_RESERVATION_STATUSES = ['pending', 'reserved', 'used'];
export const MANAGEABLE_GROUP_STATUSES = ['upcoming', 'full'];

// Reservation dates and room availability times are stored without a timezone
// and represent Vietnam local time.
const VIETNAM_NOW_SQL = `(CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh')`;
const UTC_ISO_SQL = (value) => `to_char(${value}, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')`;

export const withTransaction = async (work) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await work(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const query = (text, values = [], client = pool) => client.query(text, values);

export const toPagination = (page = 1, pageSize = 8) => ({
  limit: pageSize,
  offset: (page - 1) * pageSize,
});

const SUMMARY_SELECT = `
  sg.group_id AS "groupId", sg.created_by AS "hostId", sg.subject, sg.title,
  sg.description, sg.requirements, sg.capacity, sg.current_num AS "currentMembers",
  CASE
    WHEN rr.status = 'cancelled' OR sg.status = 'cancelled' THEN 'cancelled'
    WHEN sg.status = 'expired' THEN 'expired'
    WHEN sg.status = 'completed' THEN 'completed'
    WHEN rr.status = 'used' AND rr.start_date + ra.end_time <= ${VIETNAM_NOW_SQL} THEN 'completed'
    WHEN rr.status <> 'used' AND rr.start_date + ra.start_time <= ${VIETNAM_NOW_SQL} THEN 'expired'
    WHEN rr.status = 'used' AND rr.start_date + ra.start_time <= ${VIETNAM_NOW_SQL} THEN 'inprogress'
    WHEN sg.current_num >= sg.capacity THEN 'full'
    ELSE 'upcoming'
  END AS status,
  COALESCE((to_jsonb(sg)->>'created_at')::timestamp, rr.start_date::timestamp) AS "createdAt",
  COALESCE((to_jsonb(sg)->>'updated_at')::timestamp, rr.start_date::timestamp) AS "updatedAt",
  rr.reserve_id AS "reserveId", to_char(rr.start_date, 'YYYY-MM-DD') AS "startDate", rr.status AS "reservationStatus",
  ra.start_time AS "startTime", ra.end_time AS "endTime",
  sr.room_id AS "roomId", sr.room_name AS "roomName", sr.capacity AS "roomCapacity",
  sr.img_url AS "imageUrl", sr.branch_id AS "branchId", b.name AS "branchName",
  u.user_id AS "hostUserId", u.username AS "hostUsername", u.avatar AS "hostAvatar",
  u.role AS "hostRole", u.occupation AS "hostOccupation",
  u.hometown AS "hostHometown", u.description AS "hostDescription"
`;

const SUMMARY_FROM = `
  FROM study_group sg
  JOIN reserve_room rr ON rr.reserve_id = sg.reserve_id
  JOIN room_avail ra ON ra.avail_id = rr.avail_id
  JOIN study_room sr ON sr.room_id = ra.room_id
  JOIN branches b ON b.branch_id = sr.branch_id
  JOIN users u ON u.user_id = sg.created_by
`;

export const findSlotForCreation = async (availId, startDate, client) => {
  const result = await query(`
    SELECT ra.avail_id AS "availId", ra.start_time AS "startTime", ra.end_time AS "endTime",
      sr.room_id AS "roomId", sr.capacity, sr.room_name AS "roomName"
    FROM room_avail ra JOIN study_room sr ON sr.room_id = ra.room_id
    WHERE ra.avail_id = $1 FOR UPDATE
  `, [availId], client);
  const slot = result.rows[0] || null;
  if (!slot) return slot;
  const occupied = await query(`
    SELECT reserve_id FROM reserve_room
    WHERE avail_id = $1 AND start_date = $2
      AND status = ANY($3::text[])
    LIMIT 1
  `, [availId, startDate, ACTIVE_RESERVATION_STATUSES], client);
  return { ...slot, occupied: Boolean(occupied.rows[0]) };
};

export const insertReservation = async ({ userId, availId, startDate }, client) => {
  const result = await query(`
    INSERT INTO reserve_room (user_id, avail_id, start_date, status)
    VALUES ($1, $2, $3, 'reserved')
    RETURNING reserve_id AS "reserveId", user_id AS "userId", avail_id AS "availId", to_char(start_date, 'YYYY-MM-DD') AS "startDate", status
  `, [userId, availId, startDate], client);
  return result.rows[0];
};

export const insertStudyGroup = async ({ userId, reserveId, subject, title, description, requirements, capacity }, client) => {
  const result = await query(`
    INSERT INTO study_group (created_by, reserve_id, subject, title, description, requirements, capacity, current_num, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7, 1, CASE WHEN $7 = 1 THEN 'full' ELSE 'upcoming' END)
    RETURNING group_id AS "groupId"
  `, [userId, reserveId, subject, title, description, requirements, capacity], client);
  return result.rows[0];
};

export const findGroupSummary = async (groupId, currentUserId = null, client = pool) => {
  const result = await query(`
    SELECT ${SUMMARY_SELECT},
      (SELECT count(*)::int FROM group_request gr WHERE gr.group_id = sg.group_id AND gr.type = 'request' AND gr.status = 'pending') AS "pendingCount",
      gr.request_id AS "participationRequestId", gr.type AS "participationType", gr.status AS "participationStatus", gr.content AS "participationContent",
      gr.created_at AS "participationCreatedAt",
      ${UTC_ISO_SQL("COALESCE(gr.decided_at, CASE WHEN gr.status = 'denied' THEN gr.created_at END)")} AS "participationDecidedAt"
    ${SUMMARY_FROM}
    LEFT JOIN LATERAL (
      SELECT * FROM group_request x WHERE x.group_id = sg.group_id AND x.user_id = $2
      ORDER BY x.created_at DESC, x.decided_at DESC NULLS LAST, x.request_id DESC LIMIT 1
    ) gr ON true
    WHERE sg.group_id = $1
  `, [groupId, currentUserId], client);
  return result.rows[0] || null;
};

export const findGroupDetail = async (groupId, currentUserId = null, client = pool) => {
  const summary = await findGroupSummary(groupId, currentUserId, client);
  if (!summary) return null;
  const organizer = await query(`
    SELECT user_id AS "userId", username, avatar, role, email,
      phone_number AS "phoneNumber", to_char(birth_date, 'YYYY-MM-DD') AS "birthDate",
      gender, occupation, hometown, description
    FROM users WHERE user_id = $1
  `, [summary.hostUserId], client);
  const requests = await query(`
    SELECT gr.request_id AS "requestId", gr.group_id AS "groupId", gr.content, gr.type, gr.status,
      gr.created_at AS "createdAt",
      ${UTC_ISO_SQL("COALESCE(gr.decided_at, CASE WHEN gr.status = 'denied' THEN gr.created_at END)")} AS "decidedAt",
      u.user_id AS "userId", u.username, u.avatar, u.role, u.email,
      u.phone_number AS "phoneNumber", to_char(u.birth_date, 'YYYY-MM-DD') AS "birthDate",
      u.gender, u.occupation, u.hometown, u.description
    FROM group_request gr JOIN users u ON u.user_id = gr.user_id
    WHERE gr.group_id = $1 AND (gr.status = 'approved' OR (gr.type = 'request' AND gr.status = 'pending'))
    ORDER BY gr.created_at ASC
  `, [groupId], client);
  return { summary, organizer: organizer.rows[0], requests: requests.rows };
};

const listGroups = async ({ where, values, page, pageSize, order }, client = pool) => {
  const { limit, offset } = toPagination(page, pageSize);
  const count = await query(`SELECT count(*)::int AS total ${SUMMARY_FROM} ${where}`, values, client);
  const result = await query(`
    SELECT ${SUMMARY_SELECT},
      (SELECT count(*)::int FROM group_request gr WHERE gr.group_id = sg.group_id AND gr.type = 'request' AND gr.status = 'pending') AS "pendingCount"
    ${SUMMARY_FROM} ${where} ORDER BY ${order} LIMIT $${values.length + 1} OFFSET $${values.length + 2}
  `, [...values, limit, offset], client);
  return { rows: result.rows, total: count.rows[0]?.total || 0 };
};

const STATUS_ORDER = `CASE
  WHEN sg.status = 'expired' OR (rr.status <> 'used' AND rr.start_date + ra.start_time <= ${VIETNAM_NOW_SQL}) THEN 6
  WHEN sg.status = 'completed' OR (rr.status = 'used' AND rr.start_date + ra.end_time <= ${VIETNAM_NOW_SQL}) THEN 4
  WHEN rr.status = 'used' AND rr.start_date + ra.start_time <= ${VIETNAM_NOW_SQL} THEN 1
  WHEN sg.current_num >= sg.capacity THEN 2 ELSE 3 END`;

export const listCreatedGroups = ({ userId, page, pageSize }, client) => listGroups({
  where: "WHERE sg.created_by = $1 AND sg.status <> 'cancelled'", values: [userId], page, pageSize,
  order: `${STATUS_ORDER}, rr.start_date + ra.start_time ASC, sg.group_id ASC`,
}, client);

export const listDiscoverableGroups = async ({ currentUserId, page, pageSize, search, subject, date, startTime, endTime, branchIds = [], roomIds = [], sort }, client) => {
  const values = [];
  const filters = [
    `rr.status <> 'cancelled'`,
    `sg.status NOT IN ('cancelled', 'expired', 'completed')`,
    `(rr.start_date + ra.start_time) > ${VIETNAM_NOW_SQL}`,
    `sg.current_num < sg.capacity`,
  ];
  if (currentUserId) {
    values.push(currentUserId);
    filters.push(`sg.created_by <> $${values.length}`);
    filters.push(`NOT EXISTS (
      SELECT 1 FROM group_request approved_relationship
      WHERE approved_relationship.group_id = sg.group_id
        AND approved_relationship.user_id = $${values.length}
        AND approved_relationship.status = 'approved'
    )`);
  }
  if (search) { values.push(`%${search}%`); filters.push(`(sg.title ILIKE $${values.length} OR sg.description ILIKE $${values.length})`); }
  if (subject) { values.push(subject); filters.push(`sg.subject = $${values.length}`); }
  if (date) { values.push(date); filters.push(`rr.start_date = $${values.length}::date`); }
  if (startTime) { values.push(startTime); filters.push(`ra.start_time >= $${values.length}::time`); }
  if (endTime) { values.push(endTime); filters.push(`ra.end_time <= $${values.length}::time`); }
  if (branchIds.length) { values.push(branchIds); filters.push(`sr.branch_id = ANY($${values.length}::int[])`); }
  if (roomIds.length) { values.push(roomIds); filters.push(`sr.room_id = ANY($${values.length}::int[])`); }
  const pendingFirst = currentUserId ? `CASE WHEN EXISTS (
    SELECT 1 FROM group_request pending_relationship
    WHERE pending_relationship.group_id = sg.group_id
      AND pending_relationship.user_id = $1
      AND pending_relationship.type = 'request'
      AND pending_relationship.status = 'pending'
  ) THEN 0 ELSE 1 END, ` : '';
  const order = `${pendingFirst}rr.start_date + ra.start_time ASC, sg.group_id ASC`;
  const result = await listGroups({ where: `WHERE ${filters.join(' AND ')}`, values, page, pageSize, order }, client);
  if (currentUserId) result.rows = await Promise.all(result.rows.map((row) => findGroupSummary(row.groupId, currentUserId, client)));
  return result;
};

export const listJoinedGroups = async ({ userId, page, pageSize }, client = pool) => {
  const { limit, offset } = toPagination(page, pageSize);
  const count = await query(`
    SELECT count(DISTINCT gr.group_id)::int AS total
    FROM group_request gr
    JOIN study_group sg ON sg.group_id = gr.group_id
    WHERE gr.user_id = $1
      AND sg.status <> 'cancelled'
      AND (gr.type = 'request' OR (gr.type = 'invite' AND gr.status = 'approved'))
  `, [userId], client);
  const result = await query(`
    SELECT ${SUMMARY_SELECT}, gr.request_id AS "participationRequestId", gr.type AS "participationType", gr.status AS "participationStatus",
      gr.content AS "participationContent", gr.created_at AS "participationCreatedAt",
      ${UTC_ISO_SQL("COALESCE(gr.decided_at, CASE WHEN gr.status = 'denied' THEN gr.created_at END)")} AS "participationDecidedAt",
      0::int AS "pendingCount"
    ${SUMMARY_FROM}
    JOIN LATERAL (
      SELECT x.* FROM group_request x
      WHERE x.group_id = sg.group_id AND x.user_id = $1
        AND (x.type = 'request' OR (x.type = 'invite' AND x.status = 'approved'))
      ORDER BY x.created_at DESC, x.decided_at DESC NULLS LAST, x.request_id DESC
      LIMIT 1
    ) gr ON true
    WHERE sg.status <> 'cancelled'
    ORDER BY CASE
        WHEN gr.status IN ('pending', 'approved') AND (
          sg.status IN ('expired', 'completed', 'cancelled') OR rr.status = 'cancelled'
          OR (rr.status <> 'used' AND rr.start_date + ra.start_time <= ${VIETNAM_NOW_SQL})
          OR (rr.status = 'used' AND rr.start_date + ra.end_time <= ${VIETNAM_NOW_SQL})
        ) THEN 4
        WHEN gr.status = 'approved' THEN 1 WHEN gr.status = 'pending' THEN 2 WHEN gr.status = 'denied' THEN 3 ELSE 4 END,
      CASE
        WHEN rr.status = 'used' AND rr.start_date + ra.start_time <= ${VIETNAM_NOW_SQL} AND rr.start_date + ra.end_time >= ${VIETNAM_NOW_SQL} THEN 1
        WHEN sg.current_num >= sg.capacity AND rr.start_date + ra.start_time > ${VIETNAM_NOW_SQL} THEN 2
        WHEN rr.start_date + ra.start_time > ${VIETNAM_NOW_SQL} THEN 3
        WHEN rr.status = 'used' AND rr.start_date + ra.end_time <= ${VIETNAM_NOW_SQL} THEN 4
        WHEN rr.status = 'cancelled' OR sg.status = 'cancelled' THEN 5 ELSE 6 END,
      rr.start_date + ra.start_time ASC, gr.request_id ASC LIMIT $2 OFFSET $3
  `, [userId, limit, offset], client);
  return { rows: result.rows, total: count.rows[0]?.total || 0 };
};

export const updateGroupMetadata = async (groupId, input, client = pool) => {
  const result = await query(`
    UPDATE study_group SET
      title = COALESCE($2, title), description = COALESCE($3, description),
      subject = COALESCE($4, subject), requirements = COALESCE($5, requirements)
    WHERE group_id = $1
    RETURNING group_id AS "groupId", clock_timestamp() AS "notificationEventAt"
  `, [groupId, input.title, input.description, input.subject, input.requirements], client);
  return result.rows[0] || null;
};

export const lockGroup = async (groupId, client) => {
  const result = await query(`
    SELECT sg.*, rr.status AS reservation_status, rr.user_id AS reservation_user_id,
      rr.start_date, ra.start_time, ra.end_time
    FROM study_group sg JOIN reserve_room rr ON rr.reserve_id = sg.reserve_id
    JOIN room_avail ra ON ra.avail_id = rr.avail_id
    WHERE sg.group_id = $1 FOR UPDATE OF sg, rr
  `, [groupId], client);
  return result.rows[0] || null;
};

export const lockRequest = async (groupId, requestId, client) => {
  const result = await query('SELECT * FROM group_request WHERE group_id = $1 AND request_id = $2 FOR UPDATE', [groupId, requestId], client);
  return result.rows[0] || null;
};

export const setRequestStatus = async (requestId, expectedType, fromStatus, toStatus, client) => {
  const result = await query(`UPDATE group_request SET status = $4, decided_at = timezone('UTC', CURRENT_TIMESTAMP) WHERE request_id = $1 AND type = $2 AND status = $3 RETURNING *, ${UTC_ISO_SQL('decided_at')} AS "decidedAtUtc"`, [requestId, expectedType, fromStatus, toStatus], client);
  return result.rows[0] || null;
};

export const reconcileMemberCount = async (groupId, delta, client) => {
  const result = await query(`
    UPDATE study_group SET current_num = current_num + $2,
      status = CASE WHEN current_num + $2 >= capacity THEN 'full' ELSE 'upcoming' END
    WHERE group_id = $1 AND current_num + $2 BETWEEN 1 AND capacity RETURNING *
  `, [groupId, delta], client);
  return result.rows[0] || null;
};

export const deleteApprovedMembership = async (groupId, userId, client) => {
  const result = await query(`DELETE FROM group_request WHERE group_id = $1 AND user_id = $2 AND status = 'approved' RETURNING *`, [groupId, userId], client);
  return result.rows[0] || null;
};

export const findGroupNotificationUser = async (groupId, userId, client = pool) => {
  const result = await query(`
    SELECT u.user_id AS "userId", u.email, u.username, u.avatar
    FROM group_request gr
    JOIN users u ON u.user_id = gr.user_id
    WHERE gr.group_id = $1 AND gr.user_id = $2 AND gr.status = 'approved'
    LIMIT 1
  `, [groupId, userId], client);
  return result.rows[0] || null;
};

export const findGroupCreatorNotificationUser = async (groupId, client = pool) => {
  const result = await query(`
    SELECT u.user_id AS "userId", u.email, u.username, u.avatar
    FROM study_group sg
    JOIN users u ON u.user_id = sg.created_by
    WHERE sg.group_id = $1
    LIMIT 1
  `, [groupId], client);
  return result.rows[0] || null;
};

export const findNotificationUser = async (userId, client = pool) => {
  const result = await query(`
    SELECT user_id AS "userId", email, username, avatar
    FROM users
    WHERE user_id = $1
    LIMIT 1
  `, [userId], client);
  return result.rows[0] || null;
};

export const listApprovedNotificationRecipients = async (groupId, hostUserId, client = pool) => {
  const result = await query(`
    SELECT DISTINCT ON (u.user_id)
      u.user_id AS "userId", u.email, u.username, u.avatar
    FROM group_request gr
    JOIN users u ON u.user_id = gr.user_id
    WHERE gr.group_id = $1
      AND gr.status = 'approved'
      AND u.user_id <> $2
    ORDER BY u.user_id, gr.created_at DESC
  `, [groupId, hostUserId], client);
  return result.rows;
};

export const listGroupNotificationRecipients = async (groupId, hostUserId, client = pool) => {
  const result = await query(`
    SELECT DISTINCT ON (u.user_id)
      u.user_id AS "userId", u.email, u.username, gr.status AS "participationStatus"
    FROM group_request gr
    JOIN users u ON u.user_id = gr.user_id
    WHERE gr.group_id = $1
      AND gr.status IN ('pending', 'approved')
      AND u.user_id <> $2
      AND u.email IS NOT NULL
    ORDER BY u.user_id, CASE WHEN gr.status = 'approved' THEN 1 ELSE 2 END, gr.created_at DESC
  `, [groupId, hostUserId], client);
  return result.rows;
};

export const deletePendingRequest = async (groupId, requestId, userId, client = pool) => {
  const result = await query(`DELETE FROM group_request WHERE group_id = $1 AND request_id = $2 AND user_id = $3 AND type = 'request' AND status = 'pending' RETURNING *`, [groupId, requestId, userId], client);
  return result.rows[0] || null;
};

export const findLatestParticipation = async (groupId, userId, client = pool) => {
  const result = await query(`SELECT *, ${UTC_ISO_SQL('decided_at')} AS "decidedAtUtc", ${UTC_ISO_SQL('created_at')} AS "createdAtUtc" FROM group_request WHERE group_id = $1 AND user_id = $2 ORDER BY created_at DESC, decided_at DESC NULLS LAST, request_id DESC LIMIT 1`, [groupId, userId], client);
  return result.rows[0] || null;
};

export const deleteDeniedParticipations = async (groupId, userId, client) => {
  await query(`DELETE FROM group_request WHERE group_id = $1 AND user_id = $2 AND type = 'request' AND status = 'denied'`, [groupId, userId], client);
};

export const insertJoinRequest = async ({ groupId, userId, content }, client = pool) => {
  const result = await query(`INSERT INTO group_request (group_id, user_id, content, type, status) VALUES ($1, $2, $3, 'request', 'pending') RETURNING *`, [groupId, userId, content || null], client);
  return result.rows[0];
};

export const findUserByEmail = async (email, client = pool) => {
  const result = await query('SELECT user_id AS "userId", email, username, avatar, role FROM users WHERE lower(email) = lower($1)', [email], client);
  return result.rows[0] || null;
};

export const insertInvitation = async ({ groupId, userId, content }, client = pool) => {
  const result = await query(`INSERT INTO group_request (group_id, user_id, content, type, status)
    VALUES ($1, $2, $3, 'invite', 'pending') RETURNING request_id AS "requestId", group_id AS "groupId", user_id AS "userId", content, type, status, created_at AS "createdAt"`,
  [groupId, userId, content || null], client);
  return result.rows[0];
};

export const deletePendingInvitation = async (requestId, client = pool) => {
  await query(`DELETE FROM group_request WHERE request_id = $1 AND type = 'invite' AND status = 'pending'`, [requestId], client);
};

export const listPendingInvitations = async (userId, client = pool) => {
  const result = await query(`
    SELECT ${SUMMARY_SELECT}, gr.request_id AS "requestId", gr.content, gr.type,
      gr.status AS "invitationStatus", ${UTC_ISO_SQL('gr.created_at')} AS "invitedAt",
      u.email AS "actorEmail"
    ${SUMMARY_FROM}
    JOIN group_request gr ON gr.group_id = sg.group_id
    WHERE gr.user_id = $1
      AND gr.type = 'invite'
      AND gr.status = 'pending'
      AND sg.status NOT IN ('cancelled', 'completed', 'expired')
      AND rr.start_date + ra.start_time > ${VIETNAM_NOW_SQL}
    ORDER BY gr.created_at DESC, gr.request_id DESC
  `, [userId], client);
  return result.rows;
};

export const dissolveGroup = async (group, client) => {
  const result = await query(`DELETE FROM reserve_room WHERE reserve_id = $1 RETURNING reserve_id AS "reserveId"`, [group.reserve_id], client);
  return result.rows[0] || null;
};
