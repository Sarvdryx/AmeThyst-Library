"use client";

import React from 'react';
import { type StudyGroupLifecycleNotification } from '../../hooks/useAnnouncementBell';
import { NotificationEventBanner, NotificationActorCard, NotificationGroupInfoGrid } from './NotificationEventVisuals';

interface StudyGroupLifecycleModalProps {
  selectedSystemNotification: StudyGroupLifecycleNotification;
  onClose: () => void;
  t: (key: string) => string;
}

const notificationDestinationHref = (notification: StudyGroupLifecycleNotification) => {
  const mode = notification.destination?.mode || 'dashboard';
  const groupId = notification.destination?.groupId || notification.groupId;
  if (mode === 'created') return `/dashboard/user/yourstudygroups/created/${groupId}`;
  if (mode === 'joined') return `/dashboard/user/yourstudygroups/joined/${groupId}`;
  return '/dashboard/user/yourstudygroups';
};

export default function StudyGroupLifecycleModal({
  selectedSystemNotification,
  onClose,
  t
}: StudyGroupLifecycleModalProps) {
  const gridData = {
    subject: selectedSystemNotification.group.subject,
    currentMembers: selectedSystemNotification.group.currentMembers,
    capacity: selectedSystemNotification.group.capacity,
    showMembers: selectedSystemNotification.type === 'member_joined',
    date: selectedSystemNotification.group.date,
    startTime: selectedSystemNotification.group.startTime,
    endTime: selectedSystemNotification.group.endTime,
    branchId: selectedSystemNotification.group.branchId,
    branchName: selectedSystemNotification.group.branchName,
    roomId: selectedSystemNotification.group.roomId,
    roomName: selectedSystemNotification.group.roomName,
  };

  return (
    <div
      className="fixed inset-0 z-[95] flex items-center justify-center bg-[#07111F]/55 px-4 backdrop-blur-[2px]"
      onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <div role="dialog" aria-modal="true" aria-labelledby="system-notification-title" className="w-full max-w-lg rounded-2xl border border-[#E1D9D0] bg-[#FFFDF9] p-6 text-[#0B1C30] shadow-[0_28px_80px_rgba(7,17,31,.3)] dark:border-neutral-700 dark:bg-neutral-900 dark:text-white">
        <NotificationEventBanner type={selectedSystemNotification.type} title={selectedSystemNotification.group.title} description={t(`study_group.notification_${selectedSystemNotification.type}_description`).replace('{name}', selectedSystemNotification.memberName || t('study_group.members'))} t={t} />
        {selectedSystemNotification.actor && <NotificationActorCard actor={selectedSystemNotification.actor} t={t} />}
        {selectedSystemNotification.changedFields?.length ? (
          <div className="mt-4 rounded-xl border border-[#D8E4E8] bg-[#F4F8F9] px-4 py-3 text-sm dark:border-neutral-700 dark:bg-neutral-800">
            <b>{t('study_group.changed_fields')}</b>
            <p className="mt-1 text-[#626970] dark:text-neutral-300">{selectedSystemNotification.changedFields.map((field) => t(`study_group.field_${field}`)).join(', ')}</p>
          </div>
        ) : null}
        <NotificationGroupInfoGrid data={gridData} t={t} />
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="rounded-xl border border-[#AEB3B7] px-5 py-2.5 text-sm font-bold transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-700">{t('study_group.close')}</button>
          <button onClick={() => { onClose(); window.location.href = notificationDestinationHref(selectedSystemNotification); }} className="rounded-xl bg-[#0A3240] px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#164A59]">{selectedSystemNotification.destination?.mode === 'created' ? t('study_group.view_created_group') : selectedSystemNotification.destination?.mode === 'joined' ? t('study_group.view_joined_group') : t('study_group.view_your_groups')}</button>
        </div>
      </div>
    </div>
  );
}
