"use client";

import React from 'react';
import { type StudyGroupLifecycleNotification, type StudyGroupNotificationActor } from '../../hooks/useAnnouncementBell';
import UserAvatar from '../atoms/UserAvatar';
import { initials } from '../../utils/studyGroup';
import { displayDate, displayTimeRange } from '../../utils/notificationFormat';
import { localizedBranchName, localizedRoomName } from '../../utils/room';

export type NotificationEventType = StudyGroupLifecycleNotification['type'] | 'invitation';

export const notificationVisual = (type: NotificationEventType) => {
  if (type === 'invitation') return {
    icon: 'bg-[#DCEAEC] text-[#315A6B] dark:bg-[#173B49] dark:text-[#B9D5DE]',
    compact: 'bg-[#F4F9FA] dark:bg-[#10272F]/55',
    label: 'text-[#315A6B] dark:text-[#A9CBD6]',
    banner: 'border-[#9BBCC8] bg-[#EAF2F4] dark:border-[#315A6B] dark:bg-[#102D38]',
  };
  if (['member_removed', 'join_request_denied', 'invitation_declined'].includes(type)) return {
    icon: 'bg-[#F9E5DE] text-[#9A4935] dark:bg-[#4A261F] dark:text-[#F0B7A5]',
    compact: 'bg-[#FFF8F5] dark:bg-[#351D18]/55',
    label: 'text-[#9A4935] dark:text-[#F0B7A5]',
    banner: 'border-[#D9A797] bg-[#F9E9E3] dark:border-[#9A4935] dark:bg-[#3B211B]',
  };
  if (['member_left', 'join_request_submitted', 'join_request_cancelled', 'group_updated'].includes(type)) return {
    icon: 'bg-[#E4ECF3] text-[#486C7E] dark:bg-[#203844] dark:text-[#B4CFDA]',
    compact: 'bg-[#F5F9FB] dark:bg-[#172B34]/55',
    label: 'text-[#486C7E] dark:text-[#B4CFDA]',
    banner: 'border-[#9CB5C1] bg-[#EAF1F3] dark:border-[#486C7E] dark:bg-[#1A303A]',
  };
  if (['join_request_approved', 'member_joined'].includes(type)) return {
    icon: 'bg-[#E2F0E8] text-[#3F725B] dark:bg-[#1D3D30] dark:text-[#AED3BF]',
    compact: 'bg-[#F4FAF6] dark:bg-[#183127]/55',
    label: 'text-[#3F725B] dark:text-[#AED3BF]',
    banner: 'border-[#9EC3AE] bg-[#EAF4EE] dark:border-[#3F725B] dark:bg-[#1A3429]',
  };
  return {
    icon: 'bg-[#FBE6E3] text-[#B3261E] dark:bg-red-950/60 dark:text-red-300',
    compact: 'bg-[#FFF7F6] dark:bg-red-950/25',
    label: 'text-[#B3261E] dark:text-red-300',
    banner: 'border-[#E4A6A1] bg-[#FBE9E7] dark:border-[#B3261E] dark:bg-red-950/40',
  };
};

export function NotificationEventIcon({ type, large = false }: { type: NotificationEventType; large?: boolean }) {
  const visual = notificationVisual(type);
  const iconClass = large ? 'h-12 w-12' : 'mt-1 h-9 w-9';
  return (
    <span className={`flex shrink-0 items-center justify-center rounded-full ${iconClass} ${visual.icon}`} aria-hidden="true">
      {type === 'invitation' && <svg viewBox="0 0 24 24" className={large ? 'h-6 w-6' : 'h-[18px] w-[18px]'} fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 6.5h18v11H3zM3.5 7l8.5 6 8.5-6" /></svg>}
      {type === 'member_removed' && <svg viewBox="0 0 24 24" className={large ? 'h-6 w-6' : 'h-[18px] w-[18px]'} fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="8" r="3" /><path strokeLinecap="round" d="M3.5 19c.8-3.5 2.7-5 5.5-5s4.7 1.5 5.5 5M16 10h5" /></svg>}
      {type === 'member_left' && <svg viewBox="0 0 24 24" className={large ? 'h-6 w-6' : 'h-[18px] w-[18px]'} fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10 5H5v14h5M14 8l4 4-4 4M9 12h9" /></svg>}
      {type === 'join_request_submitted' && <span className="text-lg font-black">?</span>}
      {type === 'join_request_cancelled' && <span className="text-lg font-black">↩</span>}
      {type === 'join_request_approved' && <span className="text-lg font-black">✓</span>}
      {type === 'join_request_denied' && <span className="text-lg font-black">×</span>}
      {type === 'member_joined' && <span className="text-xl font-black">+</span>}
      {type === 'invitation_declined' && <span className="text-lg font-black">×</span>}
      {type === 'group_updated' && <span className="text-base font-black">✎</span>}
      {type === 'group_dissolved' && <svg viewBox="0 0 24 24" className={large ? 'h-6 w-6' : 'h-[18px] w-[18px]'} fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10.3 3.8 2.6 17.1A2 2 0 0 0 4.3 20h15.4a2 2 0 0 0 1.7-2.9L13.7 3.8a2 2 0 0 0-3.4 0Z" /><path strokeLinecap="round" d="M12 8v5M12 16.5h.01" /></svg>}
    </span>
  );
}

export function NotificationEventBanner({ type, title, description, t }: { type: NotificationEventType; title: string; description: string; t: (key: string) => string }) {
  const visual = notificationVisual(type);
  const label = type === 'invitation' ? t('study_group.invitation') : t(`study_group.notification_${type}`);
  return (
    <div className={`rounded-2xl border p-5 ${visual.banner}`}>
      <div className="flex items-center gap-4">
        <NotificationEventIcon type={type} large />
        <div className="min-w-0">
          <p className={`font-manrope text-[10px] font-extrabold uppercase tracking-[.14em] ${visual.label}`}>{label}</p>
          <h2 id={type === 'invitation' ? 'invitation-title' : 'system-notification-title'} className="mt-1 break-words font-hankenGrotesk text-[clamp(1.125rem,4.5vw,1.5rem)] font-bold leading-[1.2] text-[#0B1C30] dark:text-white">{title}</h2>
        </div>
      </div>
      <p className="mt-4 text-sm leading-6 text-[#4F565D] dark:text-neutral-300">{description}</p>
    </div>
  );
}

export function NotificationActorCard({ actor, t }: { actor: StudyGroupNotificationActor; t: (key: string) => string }) {
  const initialsVal = initials(actor.username) || '?';
  return (
    <div className="mt-4 flex items-center gap-3 rounded-xl border border-[#DED7CE] bg-white/70 px-4 py-3 dark:border-neutral-700 dark:bg-neutral-800/70">
      <UserAvatar
        avatar={actor.avatar}
        initials={initialsVal}
        alt={actor.username}
        className="h-11 w-11 shrink-0 border border-[#DED7CE] dark:border-neutral-700"
        fallbackClassName="bg-[#486C7E] text-white text-sm"
      />
      <div className="min-w-0">
        <span className="block font-manrope text-[10px] font-bold uppercase tracking-[.12em] text-[#486C7E] dark:text-[#9FC0CD]">
          {t('study_group.performed_by')}
        </span>
        <strong className="mt-0.5 block truncate font-hankenGrotesk text-sm text-[#0B1C30] dark:text-white">{actor.username}</strong>
        <span className="block truncate font-manrope text-xs text-[#686C71] dark:text-neutral-400">
          {actor.email || t('study_group.email_unavailable')}
        </span>
      </div>
    </div>
  );
}

export interface GroupInfoGridData {
  subject: string;
  currentMembers?: number | null;
  capacity?: number | null;
  showMembers?: boolean;
  date: string;
  startTime: string;
  endTime: string;
  branchId: number;
  branchName: string;
  roomId: number;
  roomName: string;
}

interface NotificationGroupInfoGridProps {
  data: GroupInfoGridData;
  t: (key: string) => string;
}

export function NotificationGroupInfoGrid({ data, t }: NotificationGroupInfoGridProps) {
  return (
    <div className="my-5 grid grid-cols-2 gap-3 rounded-xl bg-[#F3EEE8] p-4 text-sm dark:bg-neutral-800">
      <span><b>{t('study_group.subject')}</b><br/>{data.subject}</span>
      {data.showMembers && typeof data.currentMembers === 'number' && typeof data.capacity === 'number' && (
        <span><b>{t('study_group.members')}</b><br/>{data.currentMembers}/{data.capacity}</span>
      )}
      <span><b>{t('study_group.date')}</b><br/>{displayDate(data.date)}</span>
      <span><b>{t('study_group.time')}</b><br/>{displayTimeRange(data.startTime, data.endTime)}</span>
      <span><b>{t('study_group.branch')}</b><br/>{localizedBranchName(t, data.branchId, data.branchName)}</span>
      <span><b>{t('study_group.room')}</b><br/>{localizedRoomName(t, data.roomId, data.roomName)}</span>
    </div>
  );
}
