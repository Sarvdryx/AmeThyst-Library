"use client";

import { useRef, useState } from 'react';
import { useI18n } from '../../providers/I18nProvider';
import { apiFetch } from '../../utils/apiClient';
import BorrowInfoPanel from '../molecules/BorrowInfoPanel';
import ConditionSelector from '../molecules/ConditionSelector';

interface Borrower {
  username: string;
  gender: string;
  phone_number: string;
  email: string;
  birth_date: string;
}

interface Book {
  title: string;
  author: string;
  publisher: string;
  genres: string;
  image_url: string;
  price: number;
}

interface Borrowing {
  reserve_date: string;
  borrow_date: string;
  due_date: string;
}

interface InspectionPanelProps {
  borrowId: string;
  borrower: Borrower;
  book: Book;
  borrowing: Borrowing;
  branchId: string;
  configurationVersion: string;
  onComplete: () => void;
  onCancel: () => void;
  onConfigurationChanged: () => void;
}

export default function InspectionPanel({ borrowId, borrower, book, borrowing, branchId, configurationVersion, onComplete, onCancel, onConfigurationChanged }: InspectionPanelProps) {
  const { t } = useI18n();
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [estimatedPenalty, setEstimatedPenalty] = useState(0);
  const [previewing, setPreviewing] = useState(false);
  const [error, setError] = useState('');
  const previewRequestId = useRef(0);

  const hasDamage = selectedConditions.some(c => c !== 'perfect_condition' && c !== 'lost');
  const isPerfect = selectedConditions.includes('perfect_condition');
  const isLost = selectedConditions.includes('lost');

  const handleConditionsChange = async (nextConditions: string[]) => {
    setSelectedConditions(nextConditions);
    setPreviewing(true);
    setError('');
    const requestId = ++previewRequestId.current;
    const result = await apiFetch<{ amount: number; issue: string | null }>('/dashboard/librarian/return-penalty-preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        borrow_id: borrowId,
        conditions: nextConditions,
        is_lost: nextConditions.includes('lost'),
        expected_configuration_version: configurationVersion,
      }),
    });

    if (requestId !== previewRequestId.current) return;
    setPreviewing(false);
    if (result.success && result.data) {
      setEstimatedPenalty(result.data.amount);
      return;
    }
    if (result.error?.code === 'CONFIGURATION_CHANGED') {
      onConfigurationChanged();
      return;
    }
    setError(result.message || t('dashboard.inspection_return_error'));
  };

  const handleConfirmReturn = async () => {
    setConfirming(true);
    setError('');
    try {
      const result = await apiFetch('/dashboard/librarian/confirm-return', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          borrow_id: borrowId,
          branch_id: branchId,
          conditions: selectedConditions,
          description: hasDamage ? description : null,
          is_lost: isLost,
          expected_configuration_version: configurationVersion,
        }),
      });

      if (result.success) {
        onComplete();
      } else if (result.error?.code === 'CONFIGURATION_CHANGED') {
        onConfigurationChanged();
      } else {
        setError(result.message || t('dashboard.inspection_return_error'));
      }
    } catch {
      setError(t('dashboard.inspection_return_error'));
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-fadeIn">
      <BorrowInfoPanel borrower={borrower} book={book} borrowing={borrowing} />

      <div className="p-6 rounded-xl border border-[#E8E2D5] dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-sm">
        <p className="text-lg font-semibold dark:text-neutral-100 mb-4">{t('dashboard.inspection_condition_title')}</p>
        <ConditionSelector selected={selectedConditions} onChange={(next) => void handleConditionsChange(next)} />

        {hasDamage && (
          <div className="mt-4">
            <label className="text-sm font-medium text-neutral-500 dark:text-neutral-400">{t('dashboard.inspection_description_label')}</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={t('dashboard.inspection_description_placeholder')}
              className="mt-1 min-h-[80px] w-full p-3 rounded-lg border border-[#BBCAC0] dark:border-neutral-600 bg-white dark:bg-neutral-800 focus:outline-none focus:ring-1 focus:ring-[#0B1C30] dark:focus:ring-neutral-400 text-sm resize-none dark:text-neutral-200"
              disabled={isPerfect || isLost}
            />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold dark:text-neutral-100" aria-busy={previewing}>
          {estimatedPenalty > 0
            ? t('dashboard.inspection_penalty_preview', { amount: estimatedPenalty.toFixed(2) })
            : t('dashboard.inspection_no_penalty')}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="px-6 py-2 rounded-full border border-[#E8E2D5] dark:border-neutral-600 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors text-sm font-medium"
          >
            {t('librarian.cancel_inspection')}
          </button>
          <button
            onClick={handleConfirmReturn}
            disabled={confirming}
            className="px-6 py-2 rounded-full bg-[#1A73E8] dark:bg-blue-600 text-white hover:opacity-80 transition-opacity text-sm font-medium disabled:opacity-50"
          >
            {confirming ? t('dashboard.inspection_confirming') : t('dashboard.inspection_confirm_return')}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 text-sm">
          {error}
        </div>
      )}
    </div>
  );
}
