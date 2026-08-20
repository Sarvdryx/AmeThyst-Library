"use client";

import { useState } from 'react';
import { useI18n } from '../../../providers/I18nProvider';
import InlinePinVerification from '../../../components/organisms/InlinePinVerification';
import ReturnFlowPanel from '../../../components/organisms/ReturnFlowPanel';
import RoomCheckinTab from '../../../components/organisms/RoomCheckinTab';

type Mode = 'borrow' | 'return' | 'room';

export default function BorrowingConfirmationPage() {
  const { t } = useI18n();
  const [mode, setMode] = useState<Mode>('borrow');

  return (
    <div className="flex flex-col gap-6 w-full animate-fadeIn">
      <h1 className="font-manrope text-[40px] font-bold leading-[54.5px] text-black dark:text-neutral-100">
        {t('dashboard.pin_verification_title')}
      </h1>

      <div className="flex items-center gap-6 border-b border-[#E8E2D5] dark:border-neutral-700">
        <button
          onClick={() => setMode('borrow')}
          className={`pb-3 text-sm font-hankenGrotesk font-bold tracking-[0.05em] transition-colors ${
            mode === 'borrow'
              ? 'border-b-2 border-black dark:border-white text-[#43474D] dark:text-neutral-200'
              : 'text-[#75777D] dark:text-neutral-400 hover:text-black dark:hover:text-white'
          }`}
        >
          {t('dashboard.pin_verification_borrow_mode')}
        </button>
        <button
          onClick={() => setMode('return')}
          className={`pb-3 text-sm font-hankenGrotesk font-bold tracking-[0.05em] transition-colors ${
            mode === 'return'
              ? 'border-b-2 border-black dark:border-white text-[#43474D] dark:text-neutral-200'
              : 'text-[#75777D] dark:text-neutral-400 hover:text-black dark:hover:text-white'
          }`}
        >
          {t('dashboard.pin_verification_return_mode')}
        </button>
        <button
          onClick={() => setMode('room')}
          className={`pb-3 text-sm font-hankenGrotesk font-bold tracking-[0.05em] transition-colors ${
            mode === 'room'
              ? 'border-b-2 border-black dark:border-white text-[#43474D] dark:text-neutral-200'
              : 'text-[#75777D] dark:text-neutral-400 hover:text-black dark:hover:text-white'
          }`}
        >
          {t('dashboard.pin_verification_room_mode')}
        </button>
      </div>

      {mode === 'borrow' && <InlinePinVerification />}
      {mode === 'return' && <ReturnFlowPanel />}
      {mode === 'room' && <RoomCheckinTab />}
    </div>
  );
}
