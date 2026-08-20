"use client";

import React, { useEffect, useId, useRef, useState } from 'react';
import { useI18n } from '../../providers/I18nProvider';
import UserAvatar from '../atoms/UserAvatar';

export interface UserProfilePreview {
  name: string;
  initials: string;
  avatar?: string | null;
  role?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  birthDate?: string | null;
  gender?: string | null;
  occupation?: string | null;
  hometown?: string | null;
  description?: string | null;
}

interface UserProfileHoverCardProps {
  user: UserProfilePreview;
  children: React.ReactNode;
  align?: 'left' | 'right';
  className?: string;
}

export default function UserProfileHoverCard({
  user,
  children,
  align = 'left',
  className = '',
}: UserProfileHoverCardProps) {
  const { t } = useI18n();
  const tooltipId = useId();
  const descriptionRef = useRef<HTMLSpanElement>(null);
  const [descriptionTruncated, setDescriptionTruncated] = useState(false);
  const unknown = t('study_group.profile_unknown');
  const birthDate = user.birthDate
    ? (() => {
        const [year, month, day] = user.birthDate.slice(0, 10).split('-');
        return year && month && day ? `${day}/${month}/${year}` : user.birthDate;
      })()
    : unknown;
  const gender = user.gender
    ? t(`study_group.profile_gender_${user.gender.toLowerCase()}`)
    : unknown;
  const profileFields = [
    [t('study_group.profile_email'), user.email || unknown],
    [t('study_group.profile_birth_date'), birthDate],
    [t('study_group.profile_phone_number'), user.phoneNumber || unknown],
    [t('study_group.profile_gender'), gender],
    [t('study_group.profile_occupation'), user.occupation || unknown],
    [t('study_group.profile_hometown'), user.hometown || unknown],
  ];

  useEffect(() => {
    const description = descriptionRef.current;
    if (!description || !user.description) {
      setDescriptionTruncated(false);
      return;
    }
    const measure = () => setDescriptionTruncated(description.scrollHeight > description.clientHeight + 1);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(description);
    return () => observer.disconnect();
  }, [user.description]);

  return (
    <div
      className={`profile-preview-trigger group relative inline-flex min-w-0 ${className}`}
      tabIndex={0}
      aria-describedby={tooltipId}
    >
      {children}
      <div
        id={tooltipId}
        role="tooltip"
        className={`invisible pointer-events-none absolute bottom-full z-50 mb-3 w-72 translate-y-1 rounded-2xl border border-[#D7CFC2] bg-[#E8E2D5] p-4 text-left opacity-0 shadow-[0_18px_45px_rgba(11,28,48,0.2)] transition-[opacity,transform,visibility] duration-150 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 dark:border-neutral-700 dark:bg-neutral-900 ${
          align === 'right' ? 'right-0' : 'left-0'
        }`}
      >
        <div className="flex items-start gap-3">
          <UserAvatar
            avatar={user.avatar}
            initials={user.initials}
            alt={user.name}
            className="h-14 w-14 ring-2 ring-white/80 dark:ring-neutral-700"
            fallbackClassName="bg-[#486C7E] text-sm text-white"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <strong className="min-w-0 truncate font-hankenGrotesk text-lg font-extrabold leading-6 text-[#03192E] dark:text-white">
                {user.name}
              </strong>
              {user.role && (
                <span className="shrink-0 rounded-full bg-[#86F2E4] px-2.5 py-1 font-inter text-[10px] font-semibold uppercase tracking-wide text-[#006F66] dark:bg-teal-900/50 dark:text-teal-200">
                  {user.role}
                </span>
              )}
            </div>
            <span className="relative mt-1 block overflow-hidden">
              <span
                ref={descriptionRef}
                className={`line-clamp-4 overflow-hidden font-manrope text-xs leading-5 ${
                  user.description ? 'text-[#3C4A42] dark:text-neutral-300' : 'italic text-[#77736D] dark:text-neutral-400'
                }`}
                title={user.description || unknown}
              >
                {user.description ? `"${user.description}"` : unknown}
              </span>
              {descriptionTruncated && (
                <span aria-hidden="true" className="absolute bottom-0 right-0 bg-[#E8E2D5] pl-1 font-manrope text-xs leading-5 text-[#3C4A42] dark:bg-neutral-900 dark:text-neutral-300">
                  {'..."'}
                </span>
              )}
            </span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-[#CFC6B7] pt-3 dark:border-neutral-700">
          {profileFields.map(([label, value]) => (
            <div key={label} className="min-w-0">
              <span className="block font-manrope text-[10px] font-bold uppercase tracking-[0.08em] text-[#5E685F] dark:text-neutral-400">
                {label}
              </span>
              <span className={`mt-1 block break-words font-manrope text-xs leading-4 dark:text-white ${value === unknown ? 'italic text-[#77736D]' : 'text-[#03192E]'}`}>
                {value}
              </span>
            </div>
          ))}
        </div>
        <span className="sr-only">{t('study_group.profile_preview')}</span>
      </div>
    </div>
  );
}
