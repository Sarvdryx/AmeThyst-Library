"use client";
import React from 'react';
import { Button } from '../atoms/Button';
import Badge from '../atoms/Badge';
import { useI18n } from '../../providers/I18nProvider';
import UserAvatar from '../atoms/UserAvatar';

interface StudyGroupLeader {
  name: string;
  initials: string;
  avatar?: string | null;
  role?: string | null;
  occupation?: string | null;
  hometown?: string | null;
  description?: string | null;
}

interface StudyGroupCardProps {
  id: string;
  subject: string;
  title: string;
  description: string;
  leader: StudyGroupLeader;
  time: string;
  address: string;
  room: string;
  currentMembers: number;
  maxMembers: number;
  status: 'Available' | 'Full';
  isPending?: boolean;
  onJoin?: (id: string) => void;
  onCancelRequest?: (id: string) => void;
  onCardClick?: (id: string) => void;
  viewMode?: 'explore' | 'joined' | 'created';
  userStatus?: string;
  userApplicantStatus?: string;
  participationType?: 'request' | 'invite';
  pendingApplicants?: number;
  canJoin?: boolean;
  isJoining?: boolean;
  retryAt?: string | null;
  isCreator?: boolean;
}

export default function StudyGroupCard({
  id,
  subject,
  title,
  description,
  leader,
  time,
  address,
  room,
  currentMembers,
  maxMembers,
  status,
  isPending,
  onJoin,
  onCancelRequest,
  onCardClick,
  viewMode = 'explore',
  userStatus,
  userApplicantStatus,
  participationType,
  pendingApplicants = 0,
  canJoin = true,
  isJoining = false,
  retryAt,
  isCreator
}: StudyGroupCardProps) {
  const { t } = useI18n();
  const isFull = status === 'Full';
  const [cooldownMinutes, setCooldownMinutes] = React.useState(retryAt ? 1 : 0);
  React.useEffect(() => {
    const updateCooldown = () => {
      const remaining = retryAt ? new Date(retryAt).getTime() - Date.now() : 0;
      setCooldownMinutes(remaining > 0 ? Math.max(1, Math.ceil(remaining / 60_000)) : 0);
    };
    updateCooldown();
    const timer = window.setInterval(updateCooldown, 30_000);
    return () => window.clearInterval(timer);
  }, [retryAt]);
  const joinDisabled = isFull || Boolean(isPending) || isJoining || cooldownMinutes > 0 || Boolean(isCreator) || !canJoin;
  const isPendingInvitation = participationType === 'invite' && userApplicantStatus === 'pending';

  let isDimmed = false;
  let isUnclickable = false;

  if (viewMode === 'explore') {
    isDimmed = isFull || Boolean(isPending);
    isUnclickable = false;
  } else if (viewMode === 'created') {
    isDimmed = userStatus === 'completed' || userStatus === 'cancelled' || userStatus === 'expired';
    isUnclickable = false;
  } else if (viewMode === 'joined') {
    isDimmed = userApplicantStatus === 'denied' || userApplicantStatus === 'expired' || userStatus === 'completed' || userStatus === 'cancelled' || userStatus === 'expired';
    isUnclickable = false;
  }

  const clickableClass = isUnclickable ? 'pointer-events-none' : 'hover:shadow-lg hover:border-[#D4B895] cursor-pointer';

  const getSubjectColor = (subj: string) => {
    const hash = subj.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const colors = [
      'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
      'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
      'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
      'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300',
      'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
      'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300',
      'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
    ];
    return colors[hash % colors.length];
  };

  return (
    <div 
      className={`${viewMode === 'explore' ? 'p-5 gap-4 bg-white dark:bg-neutral-900 border-[#EAEAEA] dark:border-neutral-800' : 'p-5 gap-4 bg-white dark:bg-[#1F1F1F] border-[#EAEAEA] dark:border-neutral-700 shadow-md dark:shadow-black/50'} rounded-2xl flex flex-col border transition-all ${isDimmed ? 'opacity-60' : ''} ${clickableClass}`}
      onClick={() => onCardClick && onCardClick(id)}
    >
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2 overflow-hidden">
          <span className={`text-xs font-bold px-3 py-1.5 rounded-full truncate max-w-[120px] ${getSubjectColor(subject)}`}>
            {subject}
          </span>
          {viewMode === 'created' && userStatus && (
            <span className={`text-[13px] font-bold px-3 py-1 rounded-full shrink-0 ${
              userStatus === 'upcoming' ? 'bg-[#D8E3FB] text-[#0C447C]' :
              userStatus === 'full' ? 'bg-[#FBEED8] text-[#7C5C0C]' :
              userStatus === 'inprogress' ? 'bg-[#86F2E4] text-[#27500A]' : 
              userStatus === 'cancelled' ? 'bg-[#FBD8D8] text-[#7C0C0C]' :
              userStatus === 'completed' ? 'bg-[#E8D8FB] text-[#4C0C7C]' :
              'bg-gray-200 text-gray-800 dark:bg-neutral-700 dark:text-neutral-200'
            }`}>
              {userStatus.charAt(0).toUpperCase() + userStatus.slice(1)}
            </span>
          )}
          {viewMode === 'joined' && userApplicantStatus && (
            <span className={`text-[13px] font-bold px-3 py-1 rounded-full shrink-0 ${
              userApplicantStatus === 'approved' ? 'bg-[#D8FBD8] text-[#0C7C0C]' : 
              userApplicantStatus === 'pending' ? 'bg-[#FBEED8] text-[#7C5C0C]' :
              userApplicantStatus === 'expired' ? 'bg-gray-200 text-gray-800 dark:bg-neutral-700 dark:text-neutral-200' :
              'bg-[#FBD8D8] text-[#7C0C0C]'
            }`}>
              {userApplicantStatus.charAt(0).toUpperCase() + userApplicantStatus.slice(1)}
            </span>
          )}
        </div>
      </div>

      {/* Title & Desc */}
      <div className="flex min-w-0 flex-col gap-1">
        <h3 className={`block w-full min-w-0 truncate whitespace-nowrap font-manrope ${viewMode === 'explore' ? 'text-xl' : 'text-lg'} font-bold text-[#0B1C30] dark:text-white leading-snug`} title={title}>
          {title}
        </h3>
        <p className={`min-w-0 overflow-hidden break-words [overflow-wrap:anywhere] font-inter ${viewMode === 'explore' ? 'min-h-10 text-sm leading-5' : 'min-h-8 text-xs leading-4'} text-[#75777D] dark:text-gray-400 line-clamp-2`} title={description}>
          {description}
        </p>
      </div>

      {/* Details */}
      <div className="mt-auto flex flex-col gap-2 pt-3 text-sm text-[#486C7E] dark:text-gray-300">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <span className="whitespace-pre-line leading-5">{time}</span>
        </div>
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          <span>{address}</span>
        </div>
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
          <span>{room}</span>
        </div>
      </div>

      {/* Members Capacity & Footer for Dashboard Modes */}
      {viewMode !== 'explore' && (
        <>
          <div className="flex pt-2 flex-col items-start gap-1 w-full border-t border-[#EAEAEA] dark:border-neutral-800 mt-1">
            <div className="flex justify-between items-start w-full mb-1">
              <p className="text-[#7D7483] font-openSans text-[11px] font-bold leading-4 tracking-[0.05em]">
                MEMBERS CAPACITY
              </p>
              <p className="text-[#7D7483] font-openSans text-[11px] font-bold leading-4 tracking-[0.05em]">
                {currentMembers} / {maxMembers}
              </p>
            </div>
            <div className="w-full h-1.5 rounded-full bg-[#F8EFE6] dark:bg-neutral-800 overflow-hidden relative">
              <div 
                className="absolute left-0 top-0 h-full bg-[#0B1C30] dark:bg-white rounded-full transition-all duration-500" 
                style={{ width: `${Math.min(100, (currentMembers / maxMembers) * 100)}%` }}
              ></div>
            </div>
          </div>
          <div className="mt-auto flex min-h-10 w-full items-center justify-between pt-1">
            <div className="flex items-center gap-2 w-fit">
              <UserAvatar avatar={leader.avatar} initials={leader.initials} alt={leader.name} className="relative z-10 h-8 w-8 border-2 border-white dark:border-neutral-900" fallbackClassName="bg-[#4B0082] text-[10px] text-[#BA7EF4]" />
              {currentMembers > 1 && (
                <div className="-ml-2 flex h-8 w-8 items-center justify-center">
                  <button className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-white bg-[#C3DCFE] dark:border-neutral-900 transition-colors hover:bg-[#A9C9F5]">
                    <p className="text-[#001D36] font-openSans text-[10px] font-bold leading-[15px]">
                      +{currentMembers - 1}
                    </p>
                  </button>
                </div>
              )}
            </div>
            <div className="flex items-center justify-end w-fit">
              {viewMode === 'created' && (
                <div className="flex items-center gap-2">
                {pendingApplicants > 0 ? (
                  <div className="flex items-center gap-1.5 w-fit whitespace-nowrap">
                    <svg width="14" height="14" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M0 6.70833C0 5.31944 0.309028 4.04514 0.927083 2.88542C1.54514 1.72569 2.375 0.763889 3.41667 0L4.39583 1.33333C3.5625 1.94444 2.89931 2.71528 2.40625 3.64583C1.91319 4.57639 1.66667 5.59722 1.66667 6.70833H0ZM15 6.70833C15 5.59722 14.7535 4.57639 14.2604 3.64583C13.7674 2.71528 13.1042 1.94444 12.2708 1.33333L13.25 0C14.2917 0.763889 15.1215 1.72569 15.7396 2.88542C16.3576 4.04514 16.6667 5.31944 16.6667 6.70833H15ZM1.66667 14.2083V12.5417H3.33333V6.70833C3.33333 5.55556 3.68056 4.53125 4.375 3.63542C5.06944 2.73958 5.97222 2.15278 7.08333 1.875V1.29167C7.08333 0.944444 7.20486 0.649306 7.44792 0.40625C7.69097 0.163194 7.98611 0.0416667 8.33333 0.0416667C8.68056 0.0416667 8.97569 0.163194 9.21875 0.40625C9.46181 0.649306 9.58333 0.944444 9.58333 1.29167V1.875C10.6944 2.15278 11.5972 2.73958 12.2917 3.63542C12.9861 4.53125 13.3333 5.55556 13.3333 6.70833V12.5417H15V14.2083H1.66667ZM8.33333 16.7083C7.875 16.7083 7.48264 16.5451 7.15625 16.2188C6.82986 15.8924 6.66667 15.5 6.66667 15.0417H10C10 15.5 9.83681 15.8924 9.51042 16.2188C9.18403 16.5451 8.79167 16.7083 8.33333 16.7083ZM5 12.5417H11.6667V6.70833C11.6667 5.79167 11.3403 5.00694 10.6875 4.35417C10.0347 3.70139 9.25 3.375 8.33333 3.375C7.41667 3.375 6.63194 3.70139 5.97917 4.35417C5.32639 5.00694 5 5.79167 5 6.70833V12.5417Z" fill="#0053D0"/>
                    </svg>
                    <p className="text-[#0053D0] font-openSans text-[11px] font-bold">
                      {pendingApplicants} pending
                    </p>
                  </div>
                ) : (
                  <p className="text-[#4C4451] dark:text-gray-400 font-openSans text-[11px] leading-6">
                    No requests
                  </p>
                )}
                </div>
              )}
              {viewMode === 'joined' && (
                <div className="flex flex-col items-end justify-center">
                  <p className="text-[#7D7483] font-openSans text-[9px] font-bold tracking-wider uppercase leading-[12px]">
                    Creator
                  </p>
                  <p className="text-[#0D1C2E] dark:text-white font-inter text-xs font-semibold leading-[14px]">
                    {leader.name}
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Footer & Join Action for Explore Mode */}
      {viewMode === 'explore' && (
        <>
          <div className="flex items-center justify-between border-t border-[#EAEAEA] py-4 dark:border-neutral-800">
            <div className="flex items-center gap-2">
              <UserAvatar avatar={leader.avatar} initials={leader.initials} alt={leader.name} className="h-8 w-8" fallbackClassName="bg-[#E5F3F2] text-xs text-[#006A61] dark:bg-teal-900/30 dark:text-teal-400" />
              <div className="flex flex-col">
                <span className="text-xs text-gray-500 dark:text-gray-400">Leader</span>
                <span className="text-sm font-semibold text-[#0B1C30] dark:text-white">{leader.name}</span>
              </div>
            </div>
            <div className="flex items-center gap-1 text-sm font-semibold text-[#0B1C30] dark:text-white">
              <svg className="w-4 h-4 text-[#75777D]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              <span>{currentMembers}/{maxMembers}</span>
            </div>
          </div>
            {(canJoin || isPending || isFull || cooldownMinutes > 0 || isCreator) && (
          <div>
            <Button
              variant={joinDisabled ? 'secondary' : 'primary'}
              className="w-full py-2.5 disabled:cursor-not-allowed disabled:hover:bg-gray-100 dark:disabled:hover:bg-neutral-700"
              disabled={Boolean(isPending) ? !onCancelRequest : joinDisabled}
              onClick={(e) => {
                e.stopPropagation();
                if (isPending) onCancelRequest?.(id);
                else onJoin?.(id);
              }}
            >
              {isCreator
                ? t('study_together.your_group')
                : isFull
                ? t('study_together.status_full') 
                : isPending 
                  ? t('study_group.cancel_request')
                  : cooldownMinutes > 0
                    ? t('study_together.cooldown_minutes', { minutes: cooldownMinutes })
                  : isJoining
                    ? t('study_group.processing')
                    : isPendingInvitation
                      ? t('study_group.accept_invitation')
                      : t('study_together.join_group')}
            </Button>
          </div>
          )}
        </>
      )}
    </div>
  );
}
