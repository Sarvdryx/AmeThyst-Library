"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import { useI18n } from '../../providers/I18nProvider';
import { Button } from '../atoms';
import FilterDropdown from '../molecules/FilterDropdown';
import HistoryLogRow from '../molecules/HistoryLogRow';
import { getHistory, type HistoryEntry, type HistoryResult } from '../../utils/authorizationApi';
import { getSocket } from '../../config/socket';

const LIMIT = 20;

export default function AuthorizationHistoryPanel() {
  const { t } = useI18n();

  const [action, setAction] = useState('all');
  const [page, setPage] = useState(1);

  const [data, setData] = useState<HistoryResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [highlightedIds, setHighlightedIds] = useState<Set<string>>(new Set());
  const highlightTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await getHistory({ action, page, limit: LIMIT });
    if (res.success && res.data) {
      setData(res.data);
    } else {
      if (res.error?.code === 'MUST_CHANGE_PASSWORD' && typeof window !== 'undefined') {
        window.location.href = '/profile/security';
        return;
      }
      setError(res.message || t('admin.authorization.history_loading'));
    }
    setLoading(false);
  }, [action, page, t]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  useEffect(() => {
    const onFocus = () => {
      fetchHistory();
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [fetchHistory]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket.connected) socket.connect();

    const handleChange = (entry: HistoryEntry) => {
      if (!entry || !entry.id) return;
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          history: [entry, ...prev.history.filter((e) => e.id !== entry.id)],
        };
      });
      setHighlightedIds((prev) => new Set(prev).add(entry.id));
      if (highlightTimers.current.has(entry.id)) {
        clearTimeout(highlightTimers.current.get(entry.id));
      }
      highlightTimers.current.set(
        entry.id,
        setTimeout(() => {
          setHighlightedIds((prev) => {
            const next = new Set(prev);
            next.delete(entry.id);
            return next;
          });
          highlightTimers.current.delete(entry.id);
        }, 3000)
      );
    };

    socket.on('authorization:changed', handleChange);
    return () => {
      socket.off('authorization:changed', handleChange);
    };
  }, []);

  useEffect(() => {
    return () => {
      highlightTimers.current.forEach((timer) => clearTimeout(timer));
      highlightTimers.current.clear();
    };
  }, []);

  const pagination = data?.pagination;

  return (
    <section className="bg-white dark:bg-neutral-900 rounded-2xl border border-[#E8E2D5] dark:border-neutral-700 shadow-sm overflow-hidden">
      <div className="flex flex-wrap gap-3 p-6 items-center justify-between border-b border-[#E8E2D5] dark:border-neutral-700">
        <h2 className="font-manrope text-xl font-bold text-[#1A2E44] dark:text-neutral-100">
          {t('admin.authorization.history_title')}
        </h2>
        <FilterDropdown
          label={t('admin.authorization.filter_action')}
          value={action}
          onChange={(v) => {
            setAction(v || 'all');
            setPage(1);
          }}
          options={[
            { value: 'all', label: t('admin.authorization.action_all') },
            { value: 'PROMOTE', label: t('admin.authorization.action_promote') },
            { value: 'DEMOTE', label: t('admin.authorization.action_demote') },
            { value: 'ADMIN_INVITE', label: t('admin.authorization.action_admin_invite') },
          ]}
        />
      </div>

      <div className="flex pr-6 items-center w-full border-b border-[#E8E2D5] dark:border-neutral-700">
        <div className="flex py-3 px-6 items-center flex-1 min-w-0">
          <span className="text-[#686C71] dark:text-neutral-400 font-hankenGrotesk text-xs font-bold tracking-[0.05em] uppercase">
            {t('admin.authorization.history_col_actor')}
          </span>
        </div>
        <div className="flex py-3 px-6 items-center flex-1 min-w-0">
          <span className="text-[#686C71] dark:text-neutral-400 font-hankenGrotesk text-xs font-bold tracking-[0.05em] uppercase">
            {t('admin.authorization.history_col_target')}
          </span>
        </div>
        <div className="flex py-3 px-6 items-center shrink-0 w-[240px]">
          <span className="text-[#686C71] dark:text-neutral-400 font-hankenGrotesk text-xs font-bold tracking-[0.05em] uppercase">
            {t('admin.authorization.history_col_change')}
          </span>
        </div>
        <div className="flex py-3 px-6 items-center justify-end shrink-0 w-36">
          <span className="text-[#686C71] dark:text-neutral-400 font-hankenGrotesk text-xs font-bold tracking-[0.05em] uppercase">
            {t('admin.authorization.history_col_time')}
          </span>
        </div>
      </div>

      {loading && !data ? (
        <div className="p-12 text-center text-neutral-500 dark:text-neutral-400">
          {t('admin.authorization.history_loading')}
        </div>
      ) : error ? (
        <div className="p-12 text-center">
          <p className="text-[#D93025] dark:text-red-300 font-medium">{error}</p>
          <Button variant="outline" className="mt-4" onClick={fetchHistory}>
            {t('admin.authorization.retry')}
          </Button>
        </div>
      ) : !data || data.history.length === 0 ? (
        <div className="p-12 text-center text-neutral-500 dark:text-neutral-400">
          {t('admin.authorization.history_empty')}
        </div>
      ) : (
        <div className="overflow-x-auto">
          {data.history.map((entry) => (
            <HistoryLogRow key={entry.id} entry={entry} highlighted={highlightedIds.has(entry.id)} />
          ))}

          {pagination && pagination.totalPages > 1 && (
            <div className="flex p-4 justify-between items-center border-t border-[#E8E2D5] dark:border-neutral-700">
              <p className="text-[#43474D] dark:text-neutral-400 font-hankenGrotesk text-xs font-bold leading-4 tracking-[0.05em]">
                {t('admin.authorization.page_of', { current: pagination.page, total: pagination.totalPages })}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="flex justify-center items-center rounded-full border border-[#E8E2D5] dark:border-neutral-600 w-9 h-9 disabled:opacity-30 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                  aria-label={t('admin.authorization.previous_page')}
                >
                  <svg width="8" height="12" viewBox="0 0 8 12" fill="none">
                    <path d="M6 12L0 6L6 0L7.4 1.4L2.8 6L7.4 10.6L6 12Z" fill="#1D1C16" className="dark:fill-neutral-300" />
                  </svg>
                </button>
                <span className="font-manrope text-sm font-semibold text-[#1D1C16] dark:text-neutral-200">
                  {pagination.page} / {pagination.totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={page >= pagination.totalPages}
                  className="flex justify-center items-center rounded-full border border-[#E8E2D5] dark:border-neutral-600 w-9 h-9 disabled:opacity-30 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                  aria-label={t('admin.authorization.next_page')}
                >
                  <svg width="8" height="12" viewBox="0 0 8 12" fill="none">
                    <path d="M4.6 6L0 1.4L1.4 0L7.4 6L1.4 12L0 10.6L4.6 6Z" fill="#1D1C16" className="dark:fill-neutral-300" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
