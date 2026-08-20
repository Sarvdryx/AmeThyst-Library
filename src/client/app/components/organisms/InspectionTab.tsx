"use client";

import { useState } from 'react';
import { useI18n } from '../../providers/I18nProvider';
import { MOCK_INSPECTION } from '../../data/mockLibraryData';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getConditionKey(id: string): string {
  const map: Record<string, string> = {
    perfect: 'condition_perfect',
    cover_scratches: 'condition_cover_scratches',
    folded_pages: 'condition_folded_pages',
    pencil_marks: 'condition_pencil_marks',
    torn_pages: 'condition_torn_pages',
    water_damage: 'condition_water_damage',
  };
  return map[id] || id;
}

export default function InspectionTab() {
  const { t } = useI18n();
  const inspection = MOCK_INSPECTION;

  const [conditions, setConditions] = useState(
    inspection.conditions.map(c => ({ ...c }))
  );
  const [notes, setNotes] = useState(inspection.notes);

  const toggleCondition = (id: string) => {
    setConditions(prev =>
      prev.map(c => (c.id === id ? { ...c, selected: !c.selected } : c))
    );
  };

  const totalRepairFee = conditions
    .filter(c => c.selected)
    .reduce((sum, c) => sum + c.fee, 0);

  return (
    <div className="flex p-16 flex-col items-start gap-6 w-full animate-fadeIn">
      <div className="flex flex-col items-start w-full mb-4">
        <h1 className="text-[#0B1C30] dark:text-neutral-100 font-inter text-[32px] font-bold leading-10 tracking-[-0.02em]">
          {t('librarian.inspection_title')}
        </h1>
      </div>

      <div className="grid grid-cols-12 grid-rows-2 gap-6 w-full">
        <div className="col-span-7 row-span-1 flex flex-col p-6 items-start border border-[rgba(187,202,192,0.10)] dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-[0_4px_12px_0_rgba(11,28,48,0.05)] rounded-xl">
          <div>
            <p className="text-[#0B1C30] dark:text-neutral-100 font-inter text-xl font-semibold leading-7">
              {t('librarian.inspection_condition_heading')}
            </p>
            <p className="text-[#615E58] dark:text-neutral-400 font-manrope text-sm leading-5 mt-1">
              Select every condition found during inspection.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 w-full mt-6">
            {conditions.map(cond => {
              const isSelected = cond.selected;
              return (
                <div
                  key={cond.id}
                  onClick={() => toggleCondition(cond.id)}
                  className={`flex p-4 justify-between items-center rounded-lg cursor-pointer transition-colors ${
                    isSelected
                      ? 'border border-[rgba(0,108,77,0.30)] bg-green-50/20 dark:bg-green-900/20'
                      : 'border border-[rgba(187,202,192,0.20)] dark:border-neutral-600 hover:bg-gray-50 dark:hover:bg-neutral-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {isSelected ? (
                      <div className="flex justify-center items-center rounded border border-transparent bg-[#006C4D] w-[22px] h-[22px]">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                          <path d="M15.26 5.99C15.75 6.48 15.75 7.27 15.26 7.76L9.01 14.01C8.52 14.5 7.73 14.5 7.24 14.01L4.74 11.51C4.27 11.02 4.27 10.24 4.76 9.76C5.24 9.27 6.02 9.27 6.51 9.74L8.13 11.36L13.49 5.99C13.98 5.5 14.77 5.5 15.26 5.99Z" fill="white" />
                        </svg>
                      </div>
                    ) : (
                      <div className="rounded border border-[#BBCAC0] dark:border-neutral-500 bg-white dark:bg-neutral-800 w-5 h-5" />
                    )}
                    <span className="text-[#0B1C30] dark:text-neutral-200 font-manrope text-sm">
                      {t(`librarian.${getConditionKey(cond.id)}`)}
                    </span>
                  </div>
                  <span
                    className={`py-0.5 px-2 rounded font-manrope text-xs font-bold ${
                      isSelected
                        ? 'bg-[rgba(0,108,77,0.05)] dark:bg-green-900/30 text-[#12B886]'
                        : 'bg-[#DCE9FF] dark:bg-blue-900/30 text-[#3C4A42] dark:text-blue-300'
                    }`}
                  >
                    +${cond.fee}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="col-span-5 row-span-1 flex flex-col p-6 items-start gap-6 border border-[rgba(187,202,192,0.10)] dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-[0_4px_12px_0_rgba(11,28,48,0.05)] rounded-xl">
          <p className="text-[#0B1C30] dark:text-neutral-100 font-inter text-xl font-semibold leading-7 border-b border-b-gray-100 dark:border-b-neutral-700 pb-3 w-full">
            {t('librarian.inspection_borrower_heading')}
          </p>

          <div className="flex items-center gap-4">
            <div className="flex justify-center items-center rounded-full bg-[rgba(0,108,77,0.10)] dark:bg-green-900/30 w-12 h-12">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="w-5 h-5">
                <path d="M8 8C6.9 8 5.95 7.6 5.17 6.82C4.39 6.04 4 5.1 4 4C4 2.9 4.39 1.95 5.17 1.17C5.95 0.39 6.9 0 8 0C9.1 0 10.04 0.39 10.82 1.17C11.6 1.95 12 2.9 12 4C12 5.1 11.6 6.04 10.82 6.82C10.04 7.6 9.1 8 8 8ZM0 16V13.2C0 12.63 0.14 12.11 0.43 11.63C0.72 11.16 1.11 10.8 1.6 10.55C2.63 10.03 3.68 9.64 4.75 9.38C5.81 9.12 6.9 9 8 9C9.1 9 10.18 9.12 11.25 9.38C12.31 9.64 13.36 10.03 14.4 10.55C14.88 10.8 15.27 11.16 15.56 11.63C15.85 12.11 16 12.63 16 13.2V16H0ZM2 14H14V13.2C14 13.01 13.95 12.85 13.86 12.7C13.77 12.55 13.65 12.43 13.5 12.35C12.6 11.9 11.69 11.56 10.77 11.33C9.85 11.11 8.93 11 8 11C7.06 11 6.14 11.11 5.22 11.33C4.30 11.56 3.4 11.9 2.5 12.35C2.35 12.43 2.22 12.55 2.13 12.7C2.04 12.85 2 13.01 2 13.2V14ZM8 6C8.55 6 9.02 5.8 9.41 5.41C9.8 5.02 10 4.55 10 4C10 3.45 9.8 2.97 9.41 2.58C9.02 2.19 8.55 2 8 2C7.45 2 6.97 2.19 6.58 2.58C6.19 2.97 6 3.45 6 4C6 4.55 6.19 5.02 6.58 5.41C6.97 5.8 7.45 6 8 6Z" fill="#006C4D" />
              </svg>
            </div>
            <div>
              <p className="text-[#6C7A72] dark:text-neutral-400 font-manrope text-xs font-medium">Borrower</p>
              <p className="text-[#0B1C30] dark:text-neutral-100 font-hankenGrotesk text-xl font-semibold leading-7">{inspection.borrowerName}</p>
            </div>
          </div>

          <div className="flex gap-4 w-full">
            <div className="flex flex-col justify-center items-start shrink-0 rounded bg-[#DCE9FF] dark:bg-blue-900/30 w-24 h-36 overflow-hidden">
              <div className="w-full h-full bg-[#DCE9FF] dark:bg-blue-900/50" />
            </div>
            <div className="flex flex-col gap-1 w-full">
              <p className="text-[#0B1C30] dark:text-neutral-100 font-hankenGrotesk text-base font-semibold leading-5">{inspection.bookTitle}</p>
              <p className="text-[#615E58] dark:text-neutral-400 font-manrope text-xs font-bold tracking-[0.05em] uppercase">ISBN: {inspection.isbn}</p>

              <div className="grid grid-cols-2 gap-x-2 gap-y-0 mt-2 pt-2 border-t border-t-gray-50 dark:border-t-neutral-700">
                <div>
                  <p className="text-[#6C7A72] dark:text-neutral-400 font-manrope text-[10px] leading-[14px] uppercase">{t('librarian.inspection_borrow_date')}</p>
                  <p className="text-[#0B1C30] dark:text-neutral-200 font-manrope text-xs leading-[18px] font-semibold">{formatDate(inspection.borrowDate)}</p>
                </div>
                <div>
                  <p className="text-[#6C7A72] dark:text-neutral-400 font-manrope text-[10px] leading-[14px] uppercase">{t('librarian.inspection_due_date')}</p>
                  <p className="text-[#0B1C30] dark:text-neutral-200 font-manrope text-xs leading-[18px] font-semibold">{formatDate(inspection.dueDate)}</p>
                </div>
                <div>
                  <p className="text-[#6C7A72] dark:text-neutral-400 font-manrope text-[10px] leading-[14px] uppercase">{t('librarian.inspection_return_date')}</p>
                  <p className="text-[#BA1A1A] font-manrope text-xs leading-[18px] font-semibold">{formatDate(inspection.returnDate)}</p>
                </div>
                <div>
                  <p className="text-[#6C7A72] dark:text-neutral-400 font-manrope text-[10px] leading-[14px] uppercase">{t('librarian.inspection_loan_duration')}</p>
                  <p className="text-[#0B1C30] dark:text-neutral-200 font-manrope text-xs leading-[18px] font-semibold">{inspection.loanDuration} days</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-7 row-span-1 flex flex-col p-6 items-start gap-4 border border-[rgba(187,202,192,0.10)] dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-[0_4px_12px_0_rgba(11,28,48,0.05)] rounded-xl">
          <div className="flex items-center gap-2 w-full">
            <svg width="18" height="12" viewBox="0 0 18 12" fill="none">
              <path d="M0 12V10H12V12H0ZM0 7V5H18V7H0ZM0 2V0H18V2H0Z" fill="#0B1C30" className="dark:fill-neutral-200" />
            </svg>
            <p className="text-[#0B1C30] dark:text-neutral-100 font-hankenGrotesk text-xl font-semibold leading-7">
              {t('librarian.inspection_notes_heading')}
            </p>
          </div>
          <textarea
            placeholder={t('librarian.inspection_notes_placeholder')}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className="min-h-[100px] flex-1 p-4 rounded-lg border border-[#BBCAC0] dark:border-neutral-600 bg-white dark:bg-neutral-800 w-full focus:outline-none focus:ring-1 focus:ring-[#0B1C30] dark:focus:ring-neutral-400 text-sm font-manrope text-gray-800 dark:text-neutral-200 resize-none"
          />
        </div>

        <div className="col-span-5 row-span-1 flex flex-col p-6 items-start gap-6 border border-[rgba(187,202,192,0.10)] dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-[0_4px_12px_0_rgba(11,28,48,0.05)] rounded-xl">
          <p className="text-[#0B1C30] dark:text-neutral-100 font-hankenGrotesk text-xl font-semibold leading-7">
            {t('librarian.inspection_financial_heading')}
          </p>
          <div className="flex flex-col gap-4 w-full">
            <div className="flex justify-between items-center w-full">
              <span className="text-[#0B1C30] dark:text-neutral-200 font-manrope text-sm">{t('librarian.inspection_repair_fee')}</span>
              <span className="text-[#BA1A1A] font-manrope text-sm font-semibold">-${totalRepairFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center w-full">
              <span className="text-[#0B1C30] dark:text-neutral-200 font-manrope text-sm">{t('librarian.inspection_late_penalty')}</span>
              <span className="text-[#BA1A1A] font-manrope text-sm font-semibold">-${inspection.latePenalty.toFixed(2)}</span>
            </div>
            <div className="flex pt-4 justify-between items-center border-t border-t-[rgba(187,202,192,0.30)] dark:border-t-neutral-700 w-full">
              <span className="text-[#0B1C30] dark:text-neutral-100 font-hankenGrotesk text-base font-bold">{t('librarian.inspection_final_refund')}</span>
              <span className="text-[#006C4D] dark:text-emerald-400 font-hankenGrotesk text-base font-bold">
                ${(inspection.finalRefund - totalRepairFee).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
