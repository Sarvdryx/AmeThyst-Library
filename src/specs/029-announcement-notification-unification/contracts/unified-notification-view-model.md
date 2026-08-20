# Frontend Contract: Unified Notification View Model

This document defines the properties, normalization mappings, and click actions for the unified notification bell dropdown elements.

---

## 1. Unified Interface Definition

export type UnifiedNotificationItem =
  | {
      id: string;              // Announcement UUID
      type: 'announcement';
      title: string;           // Title text
      description: string;     // Text body or summary
      timestamp: string;       // ISO timestamp
      read: boolean;           // Seen status
      rawItem: BellAnnouncement;
    }
  | {
      id: string;              // Invitation request ID
      type: 'study_group_invitation';
      title: string;
      description: string;
      timestamp: string;
      read: boolean;
      rawItem: StudyGroupInvitation;
    }
  | {
      id: string;              // Lifecycle notification ID
      type: 'study_group_lifecycle';
      title: string;
      description: string;
      timestamp: string;
      read: boolean;
      rawItem: StudyGroupLifecycleNotification;
    };

---

## 2. Normalization Mapping Rules

### A. Announcement → Unified Item
```typescript
const mapAnnouncementToUnified = (ann: BellAnnouncement, seenAnnouncementIds: string[]): UnifiedNotificationItem => {
  const isRead = seenAnnouncementIds.includes(ann.announceId);

  return {
    id: ann.announceId,
    type: 'announcement',
    title: ann.title,
    description: ann.content,
    timestamp: ann.createdAt,
    read: isRead,
    rawItem: ann,
  };
};
```

### B. Study Group Invitation → Unified Item
```typescript
const mapInvitationToUnified = (invite: StudyGroupInvitation, readInvitationIds: string[]): UnifiedNotificationItem => {
  return {
    id: invite.requestId,
    type: 'study_group_invitation',
    title: invite.group.title,
    description: `Invited by ${invite.group.host.username}`,
    timestamp: invite.invitedAt,
    read: readInvitationIds.includes(invite.requestId),
    rawItem: invite
  };
};
```

### C. Study Group System Notification → Unified Item
```typescript
const mapSystemNotificationToUnified = (notif: StudyGroupLifecycleNotification): UnifiedNotificationItem => {
  return {
    id: notif.id,
    type: 'study_group_lifecycle',
    title: notif.group.title,
    description: notif.memberName 
      ? `Member update by ${notif.memberName}`
      : `Group status update`,
    timestamp: notif.createdAt,
    read: !!notif.read,
    rawItem: notif
  };
};
```

---

## 3. Dropdown Action Routing

When a user clicks on an item in the unified dropdown panel, it must trigger the action corresponding to its type:

| Item Type | Click Action | Modal Triggered | Local Storage State Modification |
|---|---|---|---|
| `'announcement'` | Opens Announcement Detail Modal | `AnnouncementReadingModal` | None (entire announcement source is marked read when dropdown is toggled open) |
| `'study_group_invitation'` | Opens Invitation Accept/Decline Dialog | Invitation Dialog (`NotificationBell` invitation modal) | Mark invitation ID as read: add to `study-group-invitation-read:${userId}` |
| `'study_group_lifecycle'` | Opens Notification Details Dialog | Lifecycle Notification Modal (`NotificationBell` lifecycle notification modal) | Mark notification as read: set `read: true` in `study-group-system-notifications:${userId}` array |
