import pool from '../config/postgres.mjs';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const SAVE_NOTIFICATION_SQL = `
  INSERT INTO public.notifications (user_id, category, source_ref_id, payload, is_read, created_at)
  VALUES ($1::uuid, $2, $3, $4, $5, NOW())
  ON CONFLICT (user_id, category, source_ref_id)
  DO UPDATE SET
    payload = EXCLUDED.payload,
    is_read = public.notifications.is_read OR EXCLUDED.is_read
  RETURNING notification_id, user_id, category, source_ref_id, payload, is_read, created_at
`;

const FIND_INBOX_SQL = `
  WITH unified AS (
    SELECT n.notification_id::text AS id, n.category AS type, n.source_ref_id,
      n.payload, n.is_read, n.created_at, n.notification_id AS internal_id
    FROM public.notifications n
    WHERE n.user_id = $1::uuid
      AND n.category NOT IN ('announcement', 'study_group_invitation')

    UNION ALL

    SELECT COALESCE(n.notification_id::text, 'announcement:' || a.announce_id::text) AS id,
      'announcement' AS type, a.announce_id::text AS source_ref_id,
      jsonb_build_object('title', a.title, 'content', a.content, 'expiredDate', a.expired_date) AS payload,
      COALESCE(n.is_read, false) AS is_read, a.created_at, n.notification_id AS internal_id
    FROM public.announcements a
    LEFT JOIN public.notifications n
      ON n.source_ref_id = a.announce_id::text
      AND n.category = 'announcement'
      AND n.user_id = $1::uuid
    WHERE a.status = 'active'
      AND (a.expired_date IS NULL OR a.expired_date > CURRENT_DATE)

    UNION ALL

    SELECT COALESCE(n.notification_id::text, 'study_group_invitation:' || gr.request_id::text) AS id,
      'study_group_invitation' AS type, gr.request_id::text AS source_ref_id,
      jsonb_build_object(
        'groupId', sg.group_id,
        'groupName', sg.title,
        'actor', jsonb_build_object('userId', u.user_id, 'fullName', u.username),
        'content', gr.content
      ) AS payload,
      COALESCE(n.is_read, false) AS is_read, gr.created_at, n.notification_id AS internal_id
    FROM public.group_request gr
    JOIN public.study_group sg ON gr.group_id = sg.group_id
    JOIN public.users u ON sg.created_by = u.user_id
    LEFT JOIN public.notifications n
      ON n.source_ref_id = gr.request_id::text
      AND n.category = 'study_group_invitation'
      AND n.user_id = $1::uuid
    WHERE gr.user_id = $1::uuid AND gr.type = 'invite' AND gr.status = 'pending'
  )
  SELECT * FROM unified ORDER BY created_at DESC
`;

const MARK_ALL_ANNOUNCEMENTS_READ_SQL = `
  INSERT INTO public.notifications (user_id, category, source_ref_id, payload, is_read, created_at)
  SELECT $1::uuid, 'announcement', a.announce_id::text, '{}'::jsonb, true, NOW()
  FROM public.announcements a
  WHERE a.status = 'active' AND (a.expired_date IS NULL OR a.expired_date > CURRENT_DATE)
  ON CONFLICT (user_id, category, source_ref_id) DO UPDATE SET is_read = true
  WHERE public.notifications.is_read = false
`;

const MARK_ALL_INVITATIONS_READ_SQL = `
  INSERT INTO public.notifications (user_id, category, source_ref_id, payload, is_read, created_at)
  SELECT $1::uuid, 'study_group_invitation', gr.request_id::text, '{}'::jsonb, true, NOW()
  FROM public.group_request gr
  WHERE gr.user_id = $1::uuid AND gr.type = 'invite' AND gr.status = 'pending'
  ON CONFLICT (user_id, category, source_ref_id) DO UPDATE SET is_read = true
  WHERE public.notifications.is_read = false
`;

const MARK_ALL_EXISTING_READ_SQL = `
  UPDATE public.notifications SET is_read = true
  WHERE user_id = $1::uuid AND is_read = false
  RETURNING notification_id
`;

const MIGRATE_ANNOUNCEMENTS_SQL = `
  INSERT INTO public.notifications (user_id, category, source_ref_id, payload, is_read, created_at)
  SELECT $1::uuid, 'announcement', a.announce_id::text, '{}'::jsonb, true, NOW()
  FROM public.announcements a
  WHERE a.announce_id::text = ANY($2::text[]) AND a.status = 'active'
    AND (a.expired_date IS NULL OR a.expired_date > CURRENT_DATE)
  ON CONFLICT (user_id, category, source_ref_id) DO UPDATE SET is_read = true
  WHERE public.notifications.is_read = false
`;

const MIGRATE_INVITATIONS_SQL = `
  INSERT INTO public.notifications (user_id, category, source_ref_id, payload, is_read, created_at)
  SELECT $1::uuid, 'study_group_invitation', gr.request_id::text, '{}'::jsonb, true, NOW()
  FROM public.group_request gr
  WHERE gr.user_id = $1::uuid AND gr.type = 'invite'
    AND gr.request_id::text = ANY($2::text[])
  ON CONFLICT (user_id, category, source_ref_id) DO UPDATE SET is_read = true
  WHERE public.notifications.is_read = false
`;

const RESET_ANNOUNCEMENT_RECEIPTS_SQL = `
  UPDATE public.notifications SET is_read = false
  WHERE category = 'announcement' AND source_ref_id = $1::text AND is_read = true
`;

const FIND_OWNED_RECEIPT_SQL = `
  SELECT is_read FROM public.notifications
  WHERE user_id = $1::uuid AND notification_id = $2::uuid
`;

const MARK_OWNED_RECEIPT_READ_SQL = `
  UPDATE public.notifications SET is_read = true
  WHERE user_id = $1::uuid AND notification_id = $2::uuid AND is_read = false
  RETURNING notification_id
`;

const FIND_ACTIVE_ANNOUNCEMENT_SQL = `
  SELECT announce_id FROM public.announcements
  WHERE announce_id = $1::uuid AND status = 'active'
    AND (expired_date IS NULL OR expired_date > CURRENT_DATE)
`;

const MARK_ANNOUNCEMENT_RECEIPT_READ_SQL = `
  INSERT INTO public.notifications (user_id, category, source_ref_id, payload, is_read, created_at)
  VALUES ($1::uuid, 'announcement', $2::text, '{}'::jsonb, true, NOW())
  ON CONFLICT (user_id, category, source_ref_id) DO UPDATE SET is_read = true
  WHERE public.notifications.is_read = false RETURNING notification_id
`;

const FIND_OWNED_INVITATION_SQL = `
  SELECT request_id FROM public.group_request
  WHERE request_id = $1::uuid AND user_id = $2::uuid AND type = 'invite'
`;

const MARK_INVITATION_RECEIPT_READ_SQL = `
  INSERT INTO public.notifications (user_id, category, source_ref_id, payload, is_read, created_at)
  VALUES ($1::uuid, 'study_group_invitation', $2::text, '{}'::jsonb, true, NOW())
  ON CONFLICT (user_id, category, source_ref_id) DO UPDATE SET is_read = true
  WHERE public.notifications.is_read = false RETURNING notification_id
`;

const MIGRATE_STORED_RECEIPTS_SQL = `
  UPDATE public.notifications SET is_read = true
  WHERE user_id = $1::uuid AND category = $2
    AND source_ref_id = ANY($3::text[]) AND is_read = false
`;

export const saveNotification = async (
  userId,
  category,
  sourceRefId,
  payload,
  isRead = false,
  client = pool,
) => {
  const result = await client.query(
    SAVE_NOTIFICATION_SQL,
    [userId, category, sourceRefId, payload, isRead],
  );
  return result.rows[0];
};

export const findInboxByUserId = async (userId) => {
  const result = await pool.query(FIND_INBOX_SQL, [userId]);
  return result.rows;
};

export const countUnreadFromInbox = (notifications) => notifications.reduce(
  (count, notification) => count + (notification.is_read === false ? 1 : 0),
  0,
);

export const resetAnnouncementReceipts = async (announceId) => {
  const result = await pool.query(RESET_ANNOUNCEMENT_RECEIPTS_SQL, [announceId]);
  return result.rowCount;
};

const markOwnedReceiptRead = async (userId, notificationId) => {
  const owned = await pool.query(FIND_OWNED_RECEIPT_SQL, [userId, notificationId]);
  if (owned.rows.length === 0) return { found: false, updated: false };
  if (owned.rows[0].is_read) return { found: true, updated: false };
  const updated = await pool.query(MARK_OWNED_RECEIPT_READ_SQL, [userId, notificationId]);
  return { found: true, updated: updated.rows.length > 0 };
};

const markAnnouncementReceiptRead = async (userId, sourceRefId) => {
  const eligible = await pool.query(FIND_ACTIVE_ANNOUNCEMENT_SQL, [sourceRefId]);
  if (eligible.rows.length === 0) return { found: false, updated: false };
  const updated = await pool.query(MARK_ANNOUNCEMENT_RECEIPT_READ_SQL, [userId, sourceRefId]);
  return { found: true, updated: updated.rows.length > 0 };
};

const markInvitationReceiptRead = async (userId, sourceRefId) => {
  const eligible = await pool.query(FIND_OWNED_INVITATION_SQL, [sourceRefId, userId]);
  if (eligible.rows.length === 0) return { found: false, updated: false };
  const updated = await pool.query(MARK_INVITATION_RECEIPT_READ_SQL, [userId, sourceRefId]);
  return { found: true, updated: updated.rows.length > 0 };
};

export const markNotificationRead = async (userId, notificationId) => {
  if (UUID_PATTERN.test(notificationId)) return markOwnedReceiptRead(userId, notificationId);
  if (notificationId.startsWith('announcement:')) {
    const sourceRefId = notificationId.slice('announcement:'.length);
    return UUID_PATTERN.test(sourceRefId)
      ? markAnnouncementReceiptRead(userId, sourceRefId)
      : { found: false, updated: false };
  }
  if (notificationId.startsWith('study_group_invitation:')) {
    const sourceRefId = notificationId.slice('study_group_invitation:'.length);
    return UUID_PATTERN.test(sourceRefId)
      ? markInvitationReceiptRead(userId, sourceRefId)
      : { found: false, updated: false };
  }
  return { found: false, updated: false };
};

export const markAllNotificationsRead = async (userId) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const announcements = await client.query(MARK_ALL_ANNOUNCEMENTS_READ_SQL, [userId]);
    const invitations = await client.query(MARK_ALL_INVITATIONS_READ_SQL, [userId]);
    const existing = await client.query(MARK_ALL_EXISTING_READ_SQL, [userId]);
    await client.query('COMMIT');
    return announcements.rowCount + invitations.rowCount + existing.rowCount;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const migrateLegacyReceipts = async (userId, category, sourceRefIds) => {
  if (!sourceRefIds?.length) return 0;
  if (category === 'announcement') {
    const result = await pool.query(MIGRATE_ANNOUNCEMENTS_SQL, [userId, sourceRefIds]);
    return result.rowCount;
  }
  if (category === 'study_group_invitation') {
    const result = await pool.query(MIGRATE_INVITATIONS_SQL, [userId, sourceRefIds]);
    return result.rowCount;
  }
  const result = await pool.query(MIGRATE_STORED_RECEIPTS_SQL, [userId, category, sourceRefIds]);
  return result.rowCount;
};
