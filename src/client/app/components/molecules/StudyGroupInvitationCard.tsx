"use client";

import type { StudyGroupInvitation } from '../../types/studyGroup';
import { useI18n } from '../../providers/I18nProvider';
import { localizedBranchName, localizedRoomName } from '../../utils/room';
import UserAvatar from '../atoms/UserAvatar';

interface StudyGroupInvitationCardProps {
  invitation: StudyGroupInvitation;
  acting: boolean;
  onAccept: (invitation: StudyGroupInvitation) => void;
  onDecline: (invitation: StudyGroupInvitation) => void;
}

const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();

const displayDate = (value: string) => {
  const [year, month, day] = String(value).slice(0, 10).split('-');
  return year && month && day ? `${day}/${month}/${year}` : value;
};

const displayTime = (value: string) => String(value).slice(0, 5);

export default function StudyGroupInvitationCard({ invitation, acting, onAccept, onDecline }: StudyGroupInvitationCardProps) {
  const { t } = useI18n();
  const { group } = invitation;
  const host = invitation.actor || group.host;

  return (
    <article className="group relative flex min-h-[310px] flex-col overflow-hidden rounded-2xl border border-[#DED7CE] bg-[#FFFDF9] p-5 shadow-[0_10px_28px_rgba(41,31,20,0.07)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#C8B8A5] hover:shadow-[0_16px_36px_rgba(41,31,20,0.11)] dark:border-neutral-700 dark:bg-[#1F1F1F] dark:shadow-black/20">
      <div className="absolute inset-x-0 top-0 h-1 bg-[#006A61] dark:bg-teal-500" aria-hidden="true" />

      <div className="flex items-start justify-between gap-3">
        <span className="rounded-full bg-[#DCEEEB] px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.08em] text-[#005B54] dark:bg-teal-950 dark:text-teal-200">
          {t('study_group.invitation')}
        </span>
        <span className="rounded-full bg-[#FBEED8] px-2.5 py-1 text-[11px] font-bold text-[#7C5C0C] dark:bg-amber-950/60 dark:text-amber-200">
          {t('study_group.participation_pending')}
        </span>
      </div>

      <div className="mt-4 min-w-0">
        <p className="truncate text-xs font-bold uppercase tracking-[0.08em] text-[#6B7F88] dark:text-neutral-400">{group.subject}</p>
        <h2 className="mt-1 block w-full min-w-0 truncate whitespace-nowrap font-manrope text-lg font-bold leading-snug text-[#0B1C30] dark:text-white" title={group.title}>{group.title}</h2>
        <p className="mt-2 line-clamp-2 min-h-10 min-w-0 overflow-hidden break-words [overflow-wrap:anywhere] text-xs leading-5 text-[#706B66] dark:text-neutral-400" title={group.description}>{group.description}</p>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 border-y border-[#E9E2DA] py-3 text-xs dark:border-neutral-700">
        <div><dt className="text-[#898078] dark:text-neutral-500">{t('study_group.date')}</dt><dd className="mt-0.5 font-semibold text-[#253442] dark:text-neutral-200">{displayDate(group.reservation.startDate)}</dd></div>
        <div><dt className="text-[#898078] dark:text-neutral-500">{t('study_group.time')}</dt><dd className="mt-0.5 font-semibold text-[#253442] dark:text-neutral-200">{displayTime(group.reservation.startTime)}–{displayTime(group.reservation.endTime)}</dd></div>
        <div><dt className="text-[#898078] dark:text-neutral-500">{t('study_group.branch')}</dt><dd className="mt-0.5 truncate font-semibold text-[#253442] dark:text-neutral-200">{localizedBranchName(t, group.reservation.room.branchId, group.reservation.room.branchName)}</dd></div>
        <div><dt className="text-[#898078] dark:text-neutral-500">{t('study_group.room')}</dt><dd className="mt-0.5 truncate font-semibold text-[#253442] dark:text-neutral-200">{localizedRoomName(t, group.reservation.room.roomId, group.reservation.room.roomName)}</dd></div>
      </dl>

      <div className="mt-4 flex items-center gap-2.5">
        <UserAvatar avatar={host.avatar} initials={initials(host.username)} alt={host.username} className="h-9 w-9" fallbackClassName="bg-[#DCEEEB] text-xs text-[#006A61] dark:bg-teal-950 dark:text-teal-200" />
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#898078] dark:text-neutral-500">{t('study_group.invited_by_label')}</p>
          <p className="truncate text-sm font-semibold text-[#253442] dark:text-neutral-200">{host.username}</p>
        </div>
      </div>

      <div className="mt-auto grid grid-cols-2 gap-2.5 pt-5">
        <button type="button" disabled={acting} onClick={() => onDecline(invitation)} className="min-h-10 rounded-xl border border-[#AEB3B7] px-3 py-2 text-sm font-bold text-[#3E464C] transition-colors hover:bg-[#F0ECE7] disabled:cursor-wait disabled:opacity-60 dark:border-neutral-600 dark:text-neutral-200 dark:hover:bg-neutral-800">
          {t('study_group.deny_invitation')}
        </button>
        <button type="button" disabled={acting} onClick={() => onAccept(invitation)} className="min-h-10 rounded-xl bg-[#0A3240] px-3 py-2 text-sm font-bold text-white transition-colors hover:bg-[#164A59] disabled:cursor-wait disabled:opacity-60 dark:bg-teal-700 dark:hover:bg-teal-600">
          {acting ? t('study_group.processing') : t('study_group.accept_invitation')}
        </button>
      </div>
    </article>
  );
}
