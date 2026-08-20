"use client";

import React from 'react';
import { useI18n } from '../../../providers/I18nProvider';

export default function TopReservedRoomsCard({ rooms = [] }) {
  const { t } = useI18n();

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-3xl p-6 shadow-sm border border-stone-200/60 dark:border-neutral-700 flex flex-col w-full h-[400px]">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-manrope text-xl font-bold text-black dark:text-white">
          {t('admin.top_reserved_rooms_title')}
        </h2>
      </div>

      {rooms.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-neutral-400 text-sm">
          {t('admin.no_room_data')}
        </div>
      ) : (
        <div className="flex-1 flex flex-col gap-3 overflow-y-auto custom-scrollbar pr-1">
          {rooms.map((room, idx) => (
            <div
              key={`${room.roomId}-${room.branchId}`}
              className="flex justify-between items-center py-2.5 px-3 bg-stone-50 dark:bg-neutral-700/50 rounded-xl border border-stone-100 dark:border-neutral-700"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-6 h-6 rounded-full bg-stone-200 dark:bg-neutral-600 text-xs font-bold flex items-center justify-center text-stone-700 dark:text-neutral-200 shrink-0">
                  {idx + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-bold font-hankenGrotesk text-stone-900 dark:text-neutral-100 truncate">
                    {room.roomName}
                  </p>
                  <p className="text-[11px] font-medium text-stone-500 dark:text-neutral-400 truncate">
                    {room.branchName}
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="inline-block px-2.5 py-1 bg-black text-white dark:bg-white dark:text-black rounded-lg text-xs font-bold font-mono">
                  {room.reservationTurns} {t('admin.reservation_turns')}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
