"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { apiFetch } from '../utils/apiClient';
import { useStoredUser } from '../utils/user';
import { useSocket } from '../utils/useSocket';
import { acceptStudyGroupInvitation, denyStudyGroupInvitation } from '../utils/studyGroup';
import type {
  StudyGroupNotificationActor,
  StudyGroupInvitation,
  StudyGroupLifecycleNotification,
} from '../types/studyGroup';

interface ApiNotificationRow {
  id: string;
  type: string;
  source_ref_id: string;
  payload: Record<string, unknown> | null;
  is_read: boolean;
  created_at: string;
}

interface AnnouncementInboxItem {
  notificationId: string;
  announceId: string;
  title: string;
  content: string;
  createdAt: string;
  expiredDate?: string;
}

interface InvitationInboxItem extends StudyGroupInvitation {
  notificationId: string;
}

interface SystemInboxItem extends StudyGroupLifecycleNotification {
  notificationId: string;
}

export interface NotificationItem {
  id: string;
  category: string;
  sourceId: string;
  title: string;
  description: string;
  createdAt: string;
  isRead: boolean;
  metadata: AnnouncementInboxItem | InvitationInboxItem | SystemInboxItem;
}

interface NotificationInboxResponse {
  notifications: ApiNotificationRow[];
  unreadCount: number;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);

const asActor = (value: unknown): StudyGroupNotificationActor | undefined => {
  if (!isRecord(value)) return undefined;
  return {
    ...value,
    userId: value.userId != null
      ? String(value.userId)
      : value.user_id != null ? String(value.user_id) : null,
    username: String(value.username ?? value.fullName ?? 'Unknown'),
    email: value.email != null ? String(value.email) : null,
    avatar: value.avatar != null ? String(value.avatar) : null,
  } as StudyGroupNotificationActor;
};

const asGroup = (
  value: unknown,
  fallbackTitle = 'Study Group',
): StudyGroupLifecycleNotification['group'] => {
  const group = isRecord(value) ? value : {};
  return {
    ...group,
    title: String(group.title ?? fallbackTitle),
    subject: String(group.subject ?? ''),
    currentMembers: group.currentMembers != null ? Number(group.currentMembers) : undefined,
    capacity: group.capacity != null ? Number(group.capacity) : undefined,
    date: String(group.date ?? ''),
    startTime: String(group.startTime ?? ''),
    endTime: String(group.endTime ?? ''),
    roomName: String(group.roomName ?? ''),
    branchName: String(group.branchName ?? ''),
    roomId: Number(group.roomId ?? 0),
    branchId: Number(group.branchId ?? 0),
  } as StudyGroupLifecycleNotification['group'];
};

export const isAnnouncementItem = (
  item: NotificationItem,
): item is NotificationItem & { metadata: AnnouncementInboxItem } => item.category === 'announcement';

export const isInvitationItem = (
  item: NotificationItem,
): item is NotificationItem & { metadata: InvitationInboxItem } =>
  item.category === 'study_group_invitation';

export const isSystemItem = (
  item: NotificationItem,
): item is NotificationItem & { metadata: SystemInboxItem } =>
  item.category !== 'announcement' && item.category !== 'study_group_invitation';

const setItemReadState = (item: NotificationItem, isRead: boolean): NotificationItem => ({
  ...item,
  isRead,
  metadata: isSystemItem(item) ? { ...item.metadata, read: isRead } : item.metadata,
});

const mapApiNotifications = (rows: ApiNotificationRow[]): NotificationItem[] => rows.map((row) => {
  const payload = isRecord(row.payload) ? row.payload : {};

  if (row.type === 'announcement') {
    const metadata: AnnouncementInboxItem = {
      notificationId: row.id,
      announceId: row.source_ref_id,
      title: String(payload.title ?? ''),
      content: String(payload.content ?? ''),
      createdAt: row.created_at,
      expiredDate: payload.expiredDate != null ? String(payload.expiredDate) : undefined,
    };
    return {
      id: row.id,
      category: row.type,
      sourceId: row.source_ref_id,
      title: metadata.title,
      description: metadata.content,
      createdAt: row.created_at,
      isRead: row.is_read,
      metadata,
    };
  }

  if (row.type === 'study_group_invitation') {
    const actor = asActor(payload.actor);
    const storedGroup = isRecord(payload.group) ? payload.group : {};
    const storedHost = isRecord(storedGroup.host) ? storedGroup.host : {};
    const requirements = storedGroup.requirements ?? payload.requirements;
    const metadata: InvitationInboxItem = {
      notificationId: row.id,
      requestId: row.source_ref_id,
      content: payload.content != null ? String(payload.content) : null,
      invitedAt: row.created_at,
      actor,
      group: {
        ...storedGroup,
        groupId: String(storedGroup.groupId ?? payload.groupId ?? ''),
        title: String(storedGroup.title ?? payload.groupName ?? 'Study Group'),
        subject: String(storedGroup.subject ?? payload.subject ?? ''),
        description: String(storedGroup.description ?? payload.description ?? ''),
        requirements: Array.isArray(requirements) ? requirements.map(String) : [],
        host: {
          ...storedHost,
          userId: String(storedHost.userId ?? storedHost.user_id ?? actor?.userId ?? ''),
          username: String(storedHost.username ?? storedHost.fullName ?? actor?.username ?? 'Someone'),
          avatar: storedHost.avatar != null ? String(storedHost.avatar) : actor?.avatar ?? null,
        },
        reservation: (storedGroup.reservation ?? payload.reservation) as StudyGroupInvitation['group']['reservation'],
        capacity: Number(storedGroup.capacity ?? payload.capacity ?? 0),
        currentMembers: Number(storedGroup.currentMembers ?? payload.currentMembers ?? 0),
        status: String(storedGroup.status ?? 'upcoming'),
        pendingCount: Number(storedGroup.pendingCount ?? 0),
        isHost: Boolean(storedGroup.isHost ?? false),
        currentUserParticipation: storedGroup.currentUserParticipation ?? null,
        canJoin: Boolean(storedGroup.canJoin ?? false),
        retryAt: storedGroup.retryAt != null ? String(storedGroup.retryAt) : null,
        createdAt: String(storedGroup.createdAt ?? row.created_at),
        updatedAt: String(storedGroup.updatedAt ?? row.created_at),
      } as StudyGroupInvitation['group'],
    };
    return {
      id: row.id,
      category: row.type,
      sourceId: row.source_ref_id,
      title: metadata.group.title,
      description: metadata.group.host.username,
      createdAt: row.created_at,
      isRead: row.is_read,
      metadata,
    };
  }

  const stored = payload as Partial<StudyGroupLifecycleNotification> & Record<string, unknown>;
  const metadata = {
    ...stored,
    notificationId: row.id,
    id: typeof stored.id === 'string' ? stored.id : row.source_ref_id,
    type: row.type as StudyGroupLifecycleNotification['type'],
    groupId: String(stored.groupId ?? row.source_ref_id),
    createdAt: row.created_at,
    read: row.is_read,
    actor: asActor(stored.actor),
    destination: isRecord(stored.destination)
      ? { ...stored.destination } as StudyGroupLifecycleNotification['destination'] : undefined,
    changedFields: Array.isArray(stored.changedFields) ? stored.changedFields.map(String) : undefined,
    memberName: stored.memberName != null ? String(stored.memberName) : undefined,
    group: asGroup(stored.group, String(payload.groupName ?? 'Study Group')),
  } as SystemInboxItem;
  return {
    id: row.id,
    category: row.type,
    sourceId: row.source_ref_id,
    title: metadata.group.title,
    description: metadata.memberName ?? '',
    createdAt: row.created_at,
    isRead: row.is_read,
    metadata,
  };
});

const shouldApplyNotificationResult = (
  mounted: boolean,
  aborted: boolean,
  requestedUserId: number | string,
  activeUserId: number | string | undefined,
  requestToken: number,
  activeRequestToken: number,
): boolean => mounted && !aborted
  && requestedUserId === activeUserId
  && requestToken === activeRequestToken;

type InvitationDeepLinkPlan =
  | { status: 'none' }
  | { status: 'unavailable'; requestId: string }
  | { status: 'open'; requestId: string; item: NotificationItem & { metadata: InvitationInboxItem } };

const planInvitationDeepLink = (
  requestId: string | null,
  items: NotificationItem[],
): InvitationDeepLinkPlan => {
  if (!requestId) return { status: 'none' };
  const item = items.find((candidate) => isInvitationItem(candidate)
    && candidate.metadata.requestId === requestId);
  return item && isInvitationItem(item)
    ? { status: 'open', requestId, item }
    : { status: 'unavailable', requestId };
};

const consumeInvitationQueryParameter = (href: string): string => {
  const url = new URL(href);
  url.searchParams.delete('invitation');
  return `${url.pathname}${url.search}${url.hash}`;
};

interface LegacyMigrationBatch {
  key: string;
  markers: Array<{ category: string; sourceRefIds: string[] }>;
}

interface StoredValue<T> {
  present: boolean;
  valid: boolean;
  value: T;
}

const uniqueStrings = (values: string[]) => [...new Set(values.filter(Boolean))];

const readStoredStringArray = (key: string): StoredValue<string[]> => {
  if (typeof window === 'undefined') return { present: false, valid: true, value: [] };
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return { present: false, valid: true, value: [] };
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || !parsed.every((value) => typeof value === 'string')) {
      return { present: true, valid: false, value: [] };
    }
    return { present: true, valid: true, value: uniqueStrings(parsed) };
  } catch {
    return { present: true, valid: false, value: [] };
  }
};

const readStoredString = (key: string): StoredValue<string | null> => {
  if (typeof window === 'undefined') return { present: false, valid: true, value: null };
  try {
    const raw = window.localStorage.getItem(key);
    return raw === null
      ? { present: false, valid: true, value: null }
      : { present: true, valid: raw.length > 0, value: raw || null };
  } catch {
    return { present: true, valid: false, value: null };
  }
};

const readLegacyMigrationBatches = (
  userId: number | string,
  authorizedRows: ApiNotificationRow[],
): LegacyMigrationBatch[] => {
  if (typeof window === 'undefined') return [];
  const batches: LegacyMigrationBatch[] = [];
  const seenKey = `amethyst:announcements:seenIds:${userId}`;
  const lastSeenKey = `amethyst:announcements:lastSeenId:${userId}`;
  const invitationKey = `study-group-invitation-read:${userId}`;
  const systemKey = `study-group-system-notifications:${userId}`;

  const seen = readStoredStringArray(seenKey);
  if (seen.present && seen.valid) {
    batches.push({
      key: seenKey,
      markers: seen.value.length ? [{ category: 'announcement', sourceRefIds: seen.value }] : [],
    });
  }

  const lastSeen = readStoredString(lastSeenKey);
  if (lastSeen.present && lastSeen.valid && lastSeen.value) {
    const announcementIds = authorizedRows
      .filter((row) => row.type === 'announcement').map((row) => row.source_ref_id);
    const lastSeenIndex = announcementIds.indexOf(lastSeen.value);
    const sourceRefIds = lastSeenIndex >= 0 ? announcementIds.slice(lastSeenIndex) : [lastSeen.value];
    batches.push({
      key: lastSeenKey,
      markers: [{ category: 'announcement', sourceRefIds: uniqueStrings(sourceRefIds) }],
    });
  }

  const invitations = readStoredStringArray(invitationKey);
  if (invitations.present && invitations.valid) {
    batches.push({
      key: invitationKey,
      markers: invitations.value.length
        ? [{ category: 'study_group_invitation', sourceRefIds: invitations.value }] : [],
    });
  }

  try {
    const raw = window.localStorage.getItem(systemKey);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const authorized = new Set(authorizedRows
          .filter((row) => row.type !== 'announcement' && row.type !== 'study_group_invitation')
          .map((row) => `${row.type}:${row.source_ref_id}`));
        const byCategory = new Map<string, string[]>();
        for (const item of parsed) {
          if (!isRecord(item) || item.read !== true) continue;
          const category = typeof item.type === 'string' ? item.type : '';
          const sourceRefId = typeof item.id === 'string' ? item.id : '';
          if (!authorized.has(`${category}:${sourceRefId}`)) continue;
          byCategory.set(category, [...(byCategory.get(category) ?? []), sourceRefId]);
        }
        batches.push({
          key: systemKey,
          markers: [...byCategory].map(([category, sourceRefIds]) => ({
            category,
            sourceRefIds: uniqueStrings(sourceRefIds),
          })),
        });
      }
    }
  } catch {
    // Corrupt legacy data is retained instead of being deleted.
  }
  return batches;
};

const migrateLegacyNotificationStorage = async (options: {
  batches: LegacyMigrationBatch[];
  isCurrent: () => boolean;
  postMarkers: (markers: LegacyMigrationBatch['markers']) => Promise<{ success: boolean }>;
  onMigrated?: (batch: LegacyMigrationBatch) => void;
  onError?: (error: unknown) => void;
}): Promise<void> => {
  if (typeof window === 'undefined') return;
  for (const batch of options.batches) {
    if (!options.isCurrent()) return;
    try {
      const result = await options.postMarkers(batch.markers);
      if (!options.isCurrent()) return;
      if (!result.success) continue;
      window.localStorage.removeItem(batch.key);
      options.onMigrated?.(batch);
    } catch (error) {
      options.onError?.(error);
    }
  }
};

export type BellAnnouncement = AnnouncementInboxItem;
export type { StudyGroupNotificationActor, StudyGroupInvitation, StudyGroupLifecycleNotification };

type UserId = number | string;

export function useAnnouncementBell(
  enabled: boolean,
  userId?: UserId,
  t?: (key: string) => string,
) {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [stateOwnerId, setStateOwnerId] = useState<UserId | undefined>();
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [invitationUnavailable, setInvitationUnavailable] = useState(false);
  const [selected, setSelected] = useState<InvitationInboxItem | null>(null);
  const [selectedSystemNotification, setSelectedSystemNotification] = useState<SystemInboxItem | null>(null);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const storedUser = useStoredUser();
  const activeUserId = userId ?? storedUser?.userId;
  const isUserRole = storedUser?.role === 'user';
  const invitationQueryId = useSearchParams().get('invitation');
  const socket = useSocket();

  const mountedRef = useRef(true);
  const activeUserIdRef = useRef(activeUserId);
  const requestCounterRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const handledDeepLinkRef = useRef<string | null>(null);

  useEffect(() => {
    activeUserIdRef.current = activeUserId;
  }, [activeUserId]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      requestCounterRef.current += 1;
      abortControllerRef.current?.abort();
    };
  }, []);

  const invalidatePendingFetch = useCallback(() => {
    requestCounterRef.current += 1;
    abortControllerRef.current?.abort();
  }, []);

  const fetchNotifications = useCallback(async () => {
    if (activeUserId === undefined || activeUserId === null || activeUserId === '') return;
    const requestedUserId = activeUserId;
    abortControllerRef.current?.abort();
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    const requestToken = ++requestCounterRef.current;
    const isCurrent = () => shouldApplyNotificationResult(
      mountedRef.current,
      abortController.signal.aborted,
      requestedUserId,
      activeUserIdRef.current,
      requestToken,
      requestCounterRef.current,
    );

    setLoading(true);
    const response = await apiFetch<NotificationInboxResponse>(
      '/api/notifications',
      { signal: abortController.signal },
    );
    if (!isCurrent()) return;
    if (!response.success || !response.data) {
      setError(response.message || 'Notification inbox could not be loaded.');
      setLoading(false);
      return;
    }

    const rows = Array.isArray(response.data.notifications) ? response.data.notifications : [];
    setItems(mapApiNotifications(rows));
    setStateOwnerId(requestedUserId);
    setHasLoaded(true);
    setError(null);
    setLoading(false);

    await migrateLegacyNotificationStorage({
      batches: readLegacyMigrationBatches(requestedUserId, rows),
      isCurrent,
      postMarkers: (markers) => apiFetch('/api/notifications/migrate-local', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markers }),
        signal: abortController.signal,
      }),
      onMigrated: (batch) => {
        const migrated = new Set(batch.markers.flatMap((marker) =>
          marker.sourceRefIds.map((sourceId) => `${marker.category}:${sourceId}`)));
        setItems((current) => current.map((item) =>
          migrated.has(`${item.category}:${item.sourceId}`) ? setItemReadState(item, true) : item));
      },
      onError: (migrationError) => {
        if (isCurrent()) console.error('Legacy notification migration failed:', migrationError);
      },
    });
  }, [activeUserId]);

  const resetState = useCallback(() => {
    setItems([]);
    setStateOwnerId(undefined);
    setHasLoaded(false);
    setInvitationUnavailable(false);
    setSelected(null);
    setSelectedSystemNotification(null);
    setActing(false);
    setError(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    invalidatePendingFetch();
    handledDeepLinkRef.current = null;
    const synchronizeUser = async () => {
      await Promise.resolve();
      if (cancelled) return;
      resetState();
      if (enabled && activeUserId !== undefined && activeUserId !== null && activeUserId !== '') {
        await fetchNotifications();
      }
    };
    void synchronizeUser();
    return () => {
      cancelled = true;
    };
  }, [activeUserId, enabled, fetchNotifications, invalidatePendingFetch, resetState]);

  const updateAllReadLocally = useCallback(() => {
    setItems((current) => current.map((item) => setItemReadState(item, true)));
  }, []);

  useEffect(() => {
    if (!socket || !enabled || activeUserId === undefined || activeUserId === null) return;
    const refresh = () => void fetchNotifications();
    const syncRead = (event?: { notificationId?: string }) => {
      if (event?.notificationId === 'ALL') updateAllReadLocally();
      else void fetchNotifications();
    };
    socket.on('notification:new', refresh);
    socket.on('notification:read', syncRead);
    socket.on('announcement:changed', refresh);
    return () => {
      socket.off('notification:new', refresh);
      socket.off('notification:read', syncRead);
      socket.off('announcement:changed', refresh);
    };
  }, [activeUserId, enabled, fetchNotifications, socket, updateAllReadLocally]);

  const validItems = useMemo(
    () => stateOwnerId === activeUserId ? items : [],
    [activeUserId, items, stateOwnerId],
  );

  const markAsSeen = useCallback(async () => {
    if (activeUserId === undefined || activeUserId === null) return false;
    const previousItems = validItems;
    const requestedUserId = activeUserId;
    invalidatePendingFetch();
    updateAllReadLocally();
    setError(null);

    const response = await apiFetch('/api/notifications/read-all', { method: 'PATCH' });
    if (!mountedRef.current || activeUserIdRef.current !== requestedUserId) return false;
    if (response.success) return true;

    setItems(previousItems);
    setError(response.message || 'Notifications could not be marked as read.');
    void fetchNotifications();
    return false;
  }, [activeUserId, fetchNotifications, invalidatePendingFetch, updateAllReadLocally, validItems]);

  const markItemRead = useCallback(async (item: NotificationItem) => {
    if (activeUserId === undefined || activeUserId === null || item.isRead) return item.isRead;
    const requestedUserId = activeUserId;
    setItems((current) => current.map((candidate) =>
      candidate.category === item.category && candidate.sourceId === item.sourceId
        ? setItemReadState(candidate, true) : candidate));
    const response = await apiFetch(
      `/api/notifications/${encodeURIComponent(item.id)}/read`,
      { method: 'PATCH' },
    );
    if (!mountedRef.current || activeUserIdRef.current !== requestedUserId) return false;
    if (response.success) return true;
    setItems((current) => current.map((candidate) =>
      candidate.category === item.category && candidate.sourceId === item.sourceId
        ? setItemReadState(candidate, false) : candidate));
    setError(response.message || 'Notification could not be marked as read.');
    return false;
  }, [activeUserId]);

  const invitationItems = useMemo(
    () => validItems.filter(isInvitationItem),
    [validItems],
  );

  useEffect(() => {
    if (stateOwnerId !== activeUserId || !hasLoaded || !isUserRole || !invitationQueryId) return;
    const deepLinkKey = `${activeUserId}:${invitationQueryId}`;
    if (handledDeepLinkRef.current === deepLinkKey) return;
    let cancelled = false;
    const openDeepLink = async () => {
      await Promise.resolve();
      if (cancelled || handledDeepLinkRef.current === deepLinkKey) return;
      handledDeepLinkRef.current = deepLinkKey;
      const plan = planInvitationDeepLink(invitationQueryId, validItems);
      window.history.replaceState(
        window.history.state,
        '',
        consumeInvitationQueryParameter(window.location.href),
      );
      if (plan.status === 'open') {
        setSelected(plan.item.metadata);
        void markItemRead(plan.item);
      } else if (plan.status === 'unavailable') {
        setInvitationUnavailable(true);
      }
    };
    void openDeepLink();
    return () => {
      cancelled = true;
    };
  }, [activeUserId, hasLoaded, invitationQueryId, isUserRole, markItemRead, stateOwnerId, validItems]);

  const markInvitationRead = useCallback(async (invitation: InvitationInboxItem) => {
    const item = invitationItems.find((candidate) => candidate.sourceId === invitation.requestId);
    return item ? markItemRead(item) : false;
  }, [invitationItems, markItemRead]);

  const decide = useCallback(async (
    invitation: InvitationInboxItem,
    decision: 'accept' | 'deny',
  ) => {
    if (!isUserRole || activeUserId === undefined || activeUserId === null) return;
    const requestedUserId = activeUserId;
    setActing(true);
    setError(null);
    try {
      const response = decision === 'accept'
        ? await acceptStudyGroupInvitation(invitation.group.groupId, invitation.requestId)
        : await denyStudyGroupInvitation(invitation.group.groupId, invitation.requestId);
      if (!mountedRef.current || activeUserIdRef.current !== requestedUserId) return;
      if (!response.success) {
        if (['NOT_FOUND', 'STALE_STATE', 'VALIDATION_ERROR'].includes(response.error?.code ?? '')) {
          setSelected(null);
          setInvitationUnavailable(true);
          setItems((current) => current.filter((item) =>
            !isInvitationItem(item) || item.sourceId !== invitation.requestId));
          return;
        }
        setError(response.message || response.error?.message || (
          t ? t('study_group.invitation_action_error') : 'Action could not be completed.'
        ));
        return;
      }
      await markInvitationRead(invitation);
      if (!mountedRef.current || activeUserIdRef.current !== requestedUserId) return;
      setSelected(null);
      void fetchNotifications();
    } catch (decisionError) {
      if (mountedRef.current && activeUserIdRef.current === requestedUserId) {
        setError(decisionError instanceof Error ? decisionError.message : 'An unexpected error occurred.');
      }
    } finally {
      if (mountedRef.current && activeUserIdRef.current === requestedUserId) setActing(false);
    }
  }, [activeUserId, fetchNotifications, isUserRole, markInvitationRead, t]);

  return {
    items: validItems,
    loading,
    hasUnread: validItems.some((item) => !item.isRead),
    markAsSeen,
    invitationUnavailable: stateOwnerId === activeUserId ? invitationUnavailable : false,
    setInvitationUnavailable,
    selected: stateOwnerId === activeUserId ? selected : null,
    setSelected,
    selectedSystemNotification: stateOwnerId === activeUserId ? selectedSystemNotification : null,
    setSelectedSystemNotification,
    acting: stateOwnerId === activeUserId ? acting : false,
    error: stateOwnerId === activeUserId ? error : null,
    decide,
    markItemRead,
    isUserRole,
  };
}
