"use client";

import { useState } from 'react';
import { useI18n } from '../../providers/I18nProvider';
import type { Reservation } from './ReservationCard';
import { localizedBranchName } from '../../utils/room';

export function formatDuration(startTime: string, endTime: string): string {
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  const diff = eh * 60 + em - (sh * 60 + sm);
  if (diff <= 0) return '0h';
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function statusMeta(t: (key: string) => string, status: string) {
  switch (status) {
    case 'used':
      return {
        label: t('room.checked_out'),
        cls: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
      };
    case 'reserved':
      return {
        label: t('room.slot_reserved'),
        cls: 'bg-[#FFB95F]/25 text-[#8a5a12] dark:bg-[#FFB95F]/10 dark:text-[#FFB95F]',
      };
    case 'pending':
      return {
        label: t('room.slot_pending'),
        cls: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300',
      };
    default:
      return {
        label: status,
        cls: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300',
      };
  }
}

export default function RoomHistoryCard({ booking, statusBadge, user }: {
  booking: Reservation;
  statusBadge?: { label: string; cls: string };
  user?: { username: string; avatar: string | null };
}) {
  const { t, locale } = useI18n();
  const [imgError, setImgError] = useState(false);

  const formatTime = (timeStr: string) => timeStr.slice(0, 5);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatDateTime = (value?: string | null) => {
    if (!value) return null;
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return null;
    return {
      time: d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', hour12: false }),
      date: d.toLocaleDateString(locale, { day: 'numeric', month: 'short' }),
    };
  };

  const status = statusBadge ?? statusMeta(t, booking.status);
  const checkin = formatDateTime(booking.checkinTime);
  const checkout = formatDateTime(booking.checkoutTime);

  return (
    <div className="group bg-white dark:bg-neutral-800 rounded-2xl border border-[#E8E2D5] dark:border-neutral-700 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden">
      <div className="flex flex-col sm:flex-row">
        {/* Room image */}
        <div className="shrink-0 p-3 pb-0 sm:p-3 sm:pb-3 sm:w-44 sm:self-stretch bg-[#FDFBF7] dark:bg-neutral-800">
          <div className="relative h-32 sm:h-full rounded-xl overflow-hidden bg-[#F8F3E9] dark:bg-neutral-700">
            {booking.imgUrl && !imgError ? (
              <img
                src={booking.imgUrl}
                alt={booking.roomName}
                className="w-full h-full object-cover"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-400 dark:text-neutral-500">
                  <path d="M5 18H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2 3h8a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-1" />
                  <path d="M4 18h10" />
                  <circle cx="7" cy="18" r="1.5" />
                  <circle cx="17" cy="18" r="1.5" />
                </svg>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent pointer-events-none" />
          </div>
        </div>

        {/* Details */}
        <div className="flex-1 p-5">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="font-manrope text-lg font-bold leading-tight text-[#1D1C16] dark:text-neutral-100">
              {booking.roomName}
            </h4>
            <span className={`shrink-0 px-2.5 py-0.5 rounded-full text-[10px] font-bold leading-4 ${status.cls}`}>
              {status.label}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-[#75777D] dark:text-neutral-400">
            {user && (
              <span className="inline-flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full shrink-0 overflow-hidden">
                  {user.avatar ? (
                    <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="w-full h-full bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center">
                      <span className="text-indigo-700 dark:text-indigo-300 font-bold text-[9px]">
                        {user.username ? user.username.slice(0, 2).toUpperCase() : 'U'}
                      </span>
                    </span>
                  )}
                </span>
                <span className="font-semibold text-[#1D1C16] dark:text-neutral-200 truncate">{user.username}</span>
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span>{localizedBranchName(t, booking.branchId, booking.branchName)}</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span>
                {formatDate(booking.startDate)} · {formatTime(booking.startTime)} – {formatTime(booking.endTime)}
              </span>
            </span>
          </div>
          <div className="mt-3 inline-flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#75777D] dark:text-neutral-400">
              {t('room.duration')}
            </span>
            <span className="px-2.5 py-1 rounded-full bg-[#F8F3E9] dark:bg-neutral-700/60 text-xs font-semibold text-[#1D1C16] dark:text-neutral-200">
              {formatDuration(booking.startTime, booking.endTime)}
            </span>
          </div>
        </div>

        {/* Check-in / check-out stats */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 border-t sm:border-t-0 sm:border-l border-[#E8E2D5] dark:border-neutral-700 bg-[#FDFBF7] dark:bg-neutral-900/40 px-5 py-4 sm:px-5 sm:flex sm:flex-col sm:justify-center sm:gap-4">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#75777D] dark:text-neutral-400">
              {t('room.history_checkin')}
            </div>
            <div className={`mt-1.5 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 ${
              checkin ? 'bg-[#E6F4EA] dark:bg-green-900/30' : 'bg-[#F1EEE5] dark:bg-neutral-700/60'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                checkin ? 'bg-[#137333] dark:bg-green-400' : 'bg-neutral-400 dark:bg-neutral-500'
              }`} />
              <span className={`font-manrope text-sm font-bold ${
                checkin ? 'text-[#137333] dark:text-green-300' : 'text-[#75777D] dark:text-neutral-400'
              }`}>
                {checkin?.time ?? '--:--'}
              </span>
            </div>
            <div className="mt-1 text-[11px] text-[#75777D] dark:text-neutral-400">
              {checkin?.date ?? ''}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#75777D] dark:text-neutral-400">
              {t('room.history_checkout')}
            </div>
            <div className={`mt-1.5 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 ${
              checkout ? 'bg-[#E8F0FE] dark:bg-blue-900/30' : 'bg-[#F1EEE5] dark:bg-neutral-700/60'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                checkout ? 'bg-[#1A73E8] dark:bg-blue-400' : 'bg-neutral-400 dark:bg-neutral-500'
              }`} />
              <span className={`font-manrope text-sm font-bold ${
                checkout ? 'text-[#1A73E8] dark:text-blue-300' : 'text-[#75777D] dark:text-neutral-400'
              }`}>
                {checkout?.time ?? '--:--'}
              </span>
            </div>
            <div className="mt-1 text-[11px] text-[#75777D] dark:text-neutral-400">
              {checkout?.date ?? ''}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
