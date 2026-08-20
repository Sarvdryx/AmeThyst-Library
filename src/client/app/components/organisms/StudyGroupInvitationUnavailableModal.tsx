"use client";

import React from 'react';
import { NotificationEventIcon } from './NotificationEventVisuals';

interface StudyGroupInvitationUnavailableModalProps {
  onClose: () => void;
  t: (key: string) => string;
}

export default function StudyGroupInvitationUnavailableModal({
  onClose,
  t
}: StudyGroupInvitationUnavailableModalProps) {
  return (
    <div
      className="fixed inset-0 z-[95] flex items-center justify-center bg-[#07111F]/55 px-4 backdrop-blur-[2px]"
      onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <div role="alertdialog" aria-modal="true" aria-labelledby="unavailable-invitation-title" aria-describedby="unavailable-invitation-description" className="w-full max-w-sm rounded-2xl border border-[#E1D9D0] bg-[#FFFDF9] p-6 text-center text-[#0B1C30] shadow-[0_28px_80px_rgba(7,17,31,.3)] dark:border-neutral-700 dark:bg-neutral-900 dark:text-white">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#FBE6E3] text-[#B3261E]">
          <NotificationEventIcon type="group_dissolved" large />
        </div>
        <h2 id="unavailable-invitation-title" className="font-hankenGrotesk text-xl font-bold">{t('study_group.invitation_unavailable_title')}</h2>
        <p id="unavailable-invitation-description" className="mt-2 text-sm leading-6 text-[#65696E] dark:text-neutral-300">{t('study_group.invitation_unavailable')}</p>
        <button onClick={onClose} className="mt-5 rounded-xl bg-[#0A3240] px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#164A59]">{t('study_group.back_to_groups')}</button>
      </div>
    </div>
  );
}
