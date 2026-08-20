"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useI18n } from '../../../providers/I18nProvider';
import { ReservationCard, PastBookingsTable } from '../../../components/molecules';
import type { Reservation } from '../../../components/molecules';
import { apiFetch } from '../../../utils/apiClient';

export default function RoomReservationsPage() {
  const { t } = useI18n();
  const [upcoming, setUpcoming] = useState<Reservation[]>([]);
  const [past, setPast] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const itemsPerPage = 6;

  const fetchReservations = async () => {
    setLoading(true);
    try {
      const result = await apiFetch<{ upcoming: Reservation[]; past: Reservation[] }>(
        '/api/rooms/user-reservations'
      );
      if (result.success && result.data) {
        setUpcoming(result.data.upcoming || []);
        setPast(result.data.past || []);
        setFetchError(null);
      } else {
        setFetchError(result.message || 'Failed to load reservations');
      }
    } catch (err) {
      setFetchError('Network error loading reservations');
      console.error('Failed to fetch reservations:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async (from?: string, to?: string) => {
    try {
      const params = new URLSearchParams();
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      const query = params.toString();
      const result = await apiFetch<Reservation[]>(`/api/rooms/history${query ? `?${query}` : ''}`);
      if (result.success && result.data) {
        setPast(result.data);
        setFetchError(null);
      } else {
        setFetchError(result.message || 'Failed to load history');
      }
    } catch (err) {
      setFetchError('Network error loading history');
      console.error('Failed to fetch history:', err);
    }
  };

  useEffect(() => { fetchReservations(); }, []);

  const totalPages = Math.max(1, Math.ceil(upcoming.length / itemsPerPage));
  const paginatedUpcoming = upcoming.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[#1D1C16] dark:text-white font-hankenGrotesk text-5xl font-extrabold leading-[56px] tracking-[0.02em]">
          {t('dashboard.sidebar_room_reservations')}
        </h1>
        <div className="flex items-center gap-3">
          <Link href="/map">
            <button className="py-2 px-5 rounded-full bg-[#FFB95F] text-[#091426] font-bold text-sm hover:bg-[#e6a54d] transition-colors flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              {t('room.new_reservation')}
            </button>
          </Link>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="w-8 h-8 rounded-full border border-[#C5C6CD] dark:border-neutral-600 flex items-center justify-center text-[#75777D] disabled:opacity-30 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="w-8 h-8 rounded-full border border-[#C5C6CD] dark:border-neutral-600 flex items-center justify-center text-[#75777D] disabled:opacity-30 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {fetchError && (
        <div className="mb-6 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-red-700 dark:text-red-400 text-sm">
          {fetchError}
        </div>
      )}

      {/* Upcoming Section */}
      <div className="mb-10">
        <h2 className="text-[#03192E] dark:text-white font-manrope text-xl font-bold leading-7 mb-6">
          {t('room.upcoming')}
        </h2>
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : paginatedUpcoming.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-neutral-500 mb-4">{t('room.no_reservations')}</p>
            <Link href="/map">
              <button className="py-2 px-5 rounded-full bg-[#FFB95F] text-[#091426] font-bold text-sm hover:bg-[#e6a54d] transition-colors">
                {t('room.new_reservation')}
              </button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {paginatedUpcoming.map(r => (
              <ReservationCard key={r.reserveId} reservation={r} onCancelled={fetchReservations} />
            ))}
          </div>
        )}
      </div>

      {/* Past Bookings Section */}
      <div>
        <h2 className="text-[#03192E] dark:text-white font-manrope text-xl font-bold leading-7 mb-6">
          {t('room.past_bookings')}
        </h2>
        {past.length === 0 ? (
          <p className="text-neutral-500">{t('room.no_reservations')}</p>
        ) : (
          <PastBookingsTable bookings={past} onFilter={fetchHistory} onClear={fetchReservations} />
        )}
      </div>
    </div>
  );
}
