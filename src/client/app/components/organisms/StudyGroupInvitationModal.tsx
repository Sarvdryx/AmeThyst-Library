"use client";

import React from 'react';
import { type StudyGroupInvitation } from '../../hooks/useAnnouncementBell';
import { NotificationEventBanner, NotificationActorCard, NotificationGroupInfoGrid } from './NotificationEventVisuals';

interface StudyGroupInvitationModalProps {
  selected: StudyGroupInvitation;
  onClose: () => void;
  t: (key: string) => string;
  acting: boolean;
  error: string | null;
  decide: (invitation: StudyGroupInvitation, decision: 'accept' | 'deny') => void | Promise<void>;
}

export default function StudyGroupInvitationModal({
  selected,
  onClose,
  t,
  acting,
  error,
  decide
}: StudyGroupInvitationModalProps) {
  const gridData = {
    subject: selected.group.subject,
    currentMembers: selected.group.currentMembers,
    capacity: selected.group.capacity,
    showMembers: true,
    date: selected.group.reservation.startDate,
    startTime: selected.group.reservation.startTime,
    endTime: selected.group.reservation.endTime,
    branchId: selected.group.reservation.room.branchId,
    branchName: selected.group.reservation.room.branchName,
    roomId: selected.group.reservation.room.roomId,
    roomName: selected.group.reservation.room.roomName,
  };

  return (
    <div
      className="fixed inset-0 z-[95] flex items-center justify-center bg-[#07111F]/55 px-4 backdrop-blur-[2px]"
      onMouseDown={(e) => { if (e.target === e.currentTarget && !acting) onClose(); }}
    >
      <div role="dialog" aria-modal="true" aria-labelledby="invitation-title" className="w-full max-w-lg rounded-2xl border border-[#E1D9D0] bg-[#FFFDF9] p-6 text-[#0B1C30] shadow-[0_28px_80px_rgba(7,17,31,.3)] dark:border-neutral-700 dark:bg-neutral-900 dark:text-white">
        <NotificationEventBanner type="invitation" title={selected.group.title} description={t('study_group.invited_by').replace('{name}', selected.group.host.username)} t={t} />
        <NotificationActorCard actor={selected.actor || { userId: selected.group.host.userId, username: selected.group.host.username, email: selected.group.host.email || null, avatar: selected.group.host.avatar || null }} t={t} />
        <NotificationGroupInfoGrid data={gridData} t={t} />
        {selected.content && <p className="mb-4 rounded-lg border-l-4 border-[#7798A6] bg-[#EDF3F4] px-4 py-3 text-sm dark:bg-neutral-800">{selected.content}</p>}
        {error && <p role="alert" className="mb-3 text-sm text-red-600 dark:text-red-300">{error}</p>}
        <div className="flex justify-end gap-3">
          <button disabled={acting} onClick={() => void decide(selected, 'deny')} className="rounded-xl border border-[#AEB3B7] px-5 py-2.5 text-sm font-bold transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-700">{t('study_group.deny_invitation')}</button>
          <button disabled={acting} onClick={() => void decide(selected, 'accept')} className="rounded-xl bg-[#0A3240] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60 transition-colors hover:bg-[#164A59]">{acting ? t('study_group.processing') : t('study_group.accept_invitation')}</button>
        </div>
      </div>
    </div>
  );
}
