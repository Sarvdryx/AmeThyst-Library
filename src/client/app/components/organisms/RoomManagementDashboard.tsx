"use client";

import { useCallback, useEffect, useMemo, useRef, useState, Fragment } from 'react';
import { useI18n } from '../../providers/I18nProvider';
import { apiFetch } from '../../utils/apiClient';
import { getAuthToken } from '../../utils/user';
import { useSocket } from '../../utils/useSocket';
import { KPIStatCard, BookTablePagination, RoomHistoryCard } from '../molecules';
import type { Reservation } from '../molecules';
import { Skeleton } from '../atoms';

interface OverviewData {
  branchId: number;
  totalBookingsToday: number;
  occupied: number;
  totalRooms: number;
  pendingCheckins: number;
}

interface ReservationItem {
  reserveId: string;
  roomId: number;
  roomName: string;
  location: string;
  capacity: number;
  imgUrl: string | null;
  user: { userId: string; username: string; avatar: string | null };
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  checkinTime: string | null;
  checkoutTime: string | null;
  status: 'used' | 'pending' | 'reserved';
  branchId: number;
}

interface Pagination { page: number; limit: number; total: number; totalPages: number; }

interface ScheduleRoom { roomId: number; roomName: string; capacity: number; location: string; imgUrl: string | null; }
interface ScheduleEvent {
  reserveId: string;
  roomId: number;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  title: string;
}

interface ReservationDetail {
  reserveId: string;
  status: 'used' | 'pending' | 'reserved';
  date: string;
  startTime: string;
  endTime: string;
  checkinTime: string | null;
  checkoutTime: string | null;
  room: { roomId: number; roomName: string; location: string; capacity: number; imgUrl: string | null };
  user: { userId: string; username: string; email: string; phoneNumber: string; avatar: string | null };
  branchId: number;
}

type ViewMode = 'list' | 'calendar';
type CalendarGranularity = 'week' | 'day';

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

function formatLocalDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function mondayOf(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function toMinutes(time: string): number {
  const parts = time.split(':').map(Number);
  return (parts[0] || 0) * 60 + (parts[1] || 0);
}

const HOUR_PX = 44;

const fmtHM = (mins: number) => {
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

function statusBlockStyles(status: string): { block: string; accent: string } {
  switch (status) {
    case 'pending':
      return {
        block: 'bg-gradient-to-br from-[#FFD98F] to-[#FFB95F] text-[#5A3A00] border-[#F0AE4E]',
        accent: 'bg-[#C9842B]',
      };
    case 'used':
      return {
        block: 'bg-gradient-to-br from-[#2ECC8F] to-[#0EA47A] text-white border-[#0E9F6E]',
        accent: 'bg-[#047857]',
      };
    default:
      return {
        block: 'bg-gradient-to-br from-[#4E93CC] to-[#2F6FA3] text-white border-[#1E5B8C]',
        accent: 'bg-[#164E7A]',
      };
  }
}

function toReservation(detail: ReservationDetail): Reservation {
  return {
    reserveId: detail.reserveId,
    startDate: detail.date,
    startTime: detail.startTime,
    endTime: detail.endTime,
    status: detail.status,
    roomName: detail.room.roomName,
    imgUrl: detail.room.imgUrl,
    description: detail.room.location,
    capacity: detail.room.capacity,
    roomId: detail.room.roomId,
    branchId: detail.branchId,
    branchName: '',
    checkinTime: detail.checkinTime,
    checkoutTime: detail.checkoutTime,
  };
}

function toReservationFromItem(item: ReservationItem): Reservation {
  return {
    reserveId: item.reserveId,
    startDate: item.date,
    startTime: item.startTime,
    endTime: item.endTime,
    status: item.status,
    roomName: item.roomName,
    imgUrl: item.imgUrl,
    description: item.location,
    capacity: item.capacity,
    roomId: item.roomId,
    branchId: item.branchId,
    branchName: '',
    checkinTime: item.checkinTime,
    checkoutTime: item.checkoutTime,
  };
}

export default function RoomManagementDashboard() {
  const { t } = useI18n();

  const [view, setView] = useState<ViewMode>('list');

  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [overviewError, setOverviewError] = useState<string | null>(null);

  const [items, setItems] = useState<ReservationItem[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [page, setPage] = useState(1);

  const [calendarView, setCalendarView] = useState<CalendarGranularity>('week');
  const [weekAnchor, setWeekAnchor] = useState(() => formatLocalDate(new Date()));
  const [rooms, setRooms] = useState<ScheduleRoom[]>([]);
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [timeWindow, setTimeWindow] = useState<{ start: string; end: string } | null>(null);
  const [scheduleLoading, setScheduleLoading] = useState(true);
  const [scheduleError, setScheduleError] = useState<string | null>(null);

  const [detail, setDetail] = useState<ReservationDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const refreshingRef = useRef(false);
  const lastSocketRefreshRef = useRef(0);

  const fetchOverview = useCallback(async () => {
    try {
      const res = await apiFetch<OverviewData>('/dashboard/librarian/rooms/overview');
      if (res.success && res.data) {
        setOverview(res.data);
        setOverviewError(null);
      } else {
        setOverviewError(res.message || t('room_dashboard.load_failed'));
      }
    } catch (err) {
      setOverviewError(err instanceof Error ? err.message : t('room_dashboard.load_failed'));
    } finally {
      setOverviewLoading(false);
    }
  }, [t]);

  const fetchReservations = useCallback(async () => {
    setListLoading(true);
    const params = new URLSearchParams();
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (fromDate) params.set('from', fromDate);
    if (toDate) params.set('to', toDate);
    params.set('page', String(page));
    params.set('limit', '10');

    const res = await apiFetch<{ items: ReservationItem[]; pagination: Pagination }>(
      `/dashboard/librarian/rooms/reservations?${params.toString()}`
    );
    if (res.success && res.data) {
      setItems(res.data.items || []);
      setPagination(res.data.pagination || { page, limit: 10, total: 0, totalPages: 1 });
      setListError(null);
    } else {
      setListError(res.message || t('room_dashboard.load_failed'));
    }
    setListLoading(false);
  }, [debouncedSearch, fromDate, toDate, page, t]);

  const fetchSchedule = useCallback(async () => {
    setScheduleLoading(true);
    let from: string;
    let to: string;
    if (calendarView === 'day') {
      from = weekAnchor;
      to = weekAnchor;
    } else {
      const monday = mondayOf(new Date(`${weekAnchor}T00:00:00`));
      from = formatLocalDate(monday);
      to = formatLocalDate(addDays(monday, 6));
    }

    const res = await apiFetch<{ branchId: number; rooms: ScheduleRoom[]; events: ScheduleEvent[]; timeWindow?: { start: string; end: string } | null }>(
      `/dashboard/librarian/rooms/schedule?from=${from}&to=${to}&view=${calendarView}`
    );
    if (res.success && res.data) {
      setRooms(res.data.rooms || []);
      setEvents(res.data.events || []);
      setTimeWindow(res.data.timeWindow ?? null);
      setScheduleError(null);
    } else {
      setScheduleError(res.message || t('room_dashboard.load_failed'));
    }
    setScheduleLoading(false);
  }, [calendarView, weekAnchor, t]);

  const refreshAll = useCallback(async () => {
    if (refreshingRef.current) return;
    refreshingRef.current = true;
    try {
      await Promise.all([fetchOverview(), fetchReservations(), fetchSchedule()]);
    } finally {
      refreshingRef.current = false;
    }
  }, [fetchOverview, fetchReservations, fetchSchedule]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void fetchOverview(); }, [fetchOverview]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void fetchReservations(); }, [fetchReservations]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void fetchSchedule(); }, [fetchSchedule]);

  const openDetail = useCallback(async (reserveId: string) => {
    setDetailLoading(true);
    setDetailError(null);
    setDetail(null);
    const res = await apiFetch<ReservationDetail>(`/dashboard/librarian/rooms/reservations/${reserveId}`);
    if (res.success && res.data) {
      setDetail(res.data);
    } else {
      setDetailError(res.message || t('room_dashboard.load_failed'));
    }
    setDetailLoading(false);
  }, [t]);

  const socket = useSocket(getAuthToken());
  useEffect(() => {
    if (!socket) return;
    const refresh = () => {
      const now = Date.now();
      if (now - lastSocketRefreshRef.current < 5000) return;
      lastSocketRefreshRef.current = now;
      void refreshAll();
    };
    socket.on('room-dashboard:changed', refresh);
    return () => { socket.off('room-dashboard:changed', refresh); };
  }, [socket, refreshAll]);

  const occupiedPercent = overview && overview.totalRooms > 0
    ? Math.round((overview.occupied / overview.totalRooms) * 100)
    : 0;

  const weekDays = useMemo(() => {
    if (calendarView === 'day') {
      const d = new Date(`${weekAnchor}T00:00:00`);
      return [d];
    }
    const monday = mondayOf(new Date(`${weekAnchor}T00:00:00`));
    return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  }, [calendarView, weekAnchor]);

  const eventsByRoomAndDate = useMemo(() => {
    const map: Record<string, ScheduleEvent[]> = {};
    events.forEach((ev) => {
      const key = `${ev.roomId}|${ev.date}`;
      if (!map[key]) map[key] = [];
      map[key].push(ev);
    });
    return map;
  }, [events]);

  const formatTime = (time: string) => {
    const parts = time.split(':');
    return `${parts[0]}:${parts[1]}`;
  };

  // Timeline window is derived from the branch's actual availability slots in the DB.
  const windowInfo = useMemo(() => {
    const fallback = { start: 7 * 60, end: 23 * 60 };
    if (!timeWindow) return fallback;
    const start = toMinutes(timeWindow.start);
    const end = toMinutes(timeWindow.end);
    if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return fallback;
    return { start, end };
  }, [timeWindow]);

  const windowStart = windowInfo.start;
  const windowMinutes = windowInfo.end - windowInfo.start;
  const gridSteps = Math.max(1, Math.round(windowMinutes / 60));
  const stepMin = windowMinutes / gridSteps;
  const weekCellHeight = (windowMinutes / 60) * HOUR_PX;

  const todayStr = formatLocalDate(new Date());
  const vietnamNowMin = useMemo(() => {
    try {
      const s = new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' });
      const d = new Date(s);
      return d.getHours() * 60 + d.getMinutes();
    } catch {
      const d = new Date();
      return d.getHours() * 60 + d.getMinutes();
    }
  }, []);
  const nowLineLeft = Math.max(0, Math.min(100, ((vietnamNowMin - windowStart) / windowMinutes) * 100));

  const navigateWeek = (dir: -1 | 1) => {
    const base = new Date(`${weekAnchor}T00:00:00`);
    const next = calendarView === 'day'
      ? addDays(base, dir)
      : addDays(mondayOf(base), 7 * dir);
    setWeekAnchor(formatLocalDate(next));
  };

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-fadeIn">
      <div className="flex justify-between items-end flex-wrap gap-4">
        <h1 className="text-[#03192E] dark:text-neutral-100 font-inter text-[32px] font-bold leading-10 tracking-[0.125em]">
          {t('room_dashboard.title')}
        </h1>
        <div className="flex p-1 items-start rounded-full bg-[#F2EDE3] dark:bg-neutral-700">
          {(['list', 'calendar'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`cursor-pointer py-1.5 px-5 rounded-full text-sm font-bold leading-5 transition-colors ${
                view === v
                  ? 'bg-white dark:bg-neutral-600 shadow-sm text-black dark:text-neutral-100'
                  : 'text-[#43474D] dark:text-neutral-400 hover:text-black dark:hover:text-neutral-200'
              }`}
            >
              {v === 'list' ? t('room_dashboard.view_list') : t('room_dashboard.view_calendar')}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards (US1) */}
      {overviewLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-[120px] w-full rounded-xl" />)}
        </div>
      ) : overviewError ? (
        <div className="p-5 rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 font-manrope text-sm">
          {overviewError}
        </div>
      ) : overview ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
          <KPIStatCard
            icon={
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#2F6FA3] dark:text-sky-400">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            }
            value={overview.totalBookingsToday}
            label={t('room_dashboard.kpi_total_bookings')}
          />
          <KPIStatCard
            icon={
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-600 dark:text-emerald-400">
                <path d="M3 21h18" />
                <path d="M5 21V7l7-4 7 4v14" />
                <path d="M9 9h.01M15 9h.01M9 13h.01M15 13h.01" />
              </svg>
            }
            value={`${overview.occupied}/${overview.totalRooms}`}
            label={t('room_dashboard.kpi_occupied')}
            progress={occupiedPercent}
            progressColor="bg-emerald-500 dark:bg-emerald-400"
          />
          <KPIStatCard
            icon={
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-600 dark:text-amber-400">
                <path d="M12 2a5 5 0 0 1 5 5c0 2.5-1.5 3.5-3 5.5C13 14 12 16 12 17c0-1-1-2-2-4.5-1.5-2-3-3-3-5.5a5 5 0 0 1 5-5Z" />
                <circle cx="12" cy="21" r="1" />
              </svg>
            }
            value={overview.pendingCheckins}
            label={t('room_dashboard.kpi_pending_checkins')}
            variant="critical"
          />
        </div>
      ) : null}

      {/* List View (US2) */}
      {view === 'list' && (
        <div className="flex flex-col gap-4 w-full">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <div className="flex py-3 pr-4 pl-11 items-center rounded-xl border border-[#E8E2D5] dark:border-neutral-600 bg-white dark:bg-neutral-800 w-full">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder={t('room_dashboard.search_placeholder')}
                  className="w-full bg-transparent border-none outline-none font-manrope text-sm text-[#1D1C16] dark:text-neutral-200 placeholder-neutral-400"
                />
              </div>
              <svg width="18" height="24" viewBox="0 0 18 24" fill="none" className="absolute left-4 top-2.5">
                <path d="M16.6 18L10.3 11.7C9.8 12.1 9.225 12.4167 8.575 12.65C7.925 12.8833 7.23333 13 6.5 13C4.68333 13 3.14583 12.3708 1.8875 11.1125C0.629167 9.85417 0 8.31667 0 6.5C0 4.68333 0.629167 3.14583 1.8875 1.8875C3.14583 0.629167 4.68333 0 6.5 0C8.31667 0 9.85417 0.629167 11.1125 1.8875C12.3708 3.14583 13 4.68333 13 6.5C13 7.23333 12.8833 7.925 12.65 8.575C12.4167 9.225 12.1 9.8 11.7 10.3L18 16.6L16.6 18ZM6.5 11C7.75 11 8.8125 10.5625 9.6875 9.6875C10.5625 8.8125 11 7.75 11 6.5C11 5.25 10.5625 4.1875 9.6875 3.3125C8.8125 2.4375 7.75 2 6.5 2C5.25 2 4.1875 2.4375 3.3125 3.3125C2.4375 4.1875 2 5.25 2 6.5C2 7.75 2.4375 8.8125 3.3125 9.6875C4.1875 10.5625 5.25 11 6.5 11Z" fill="#74777D" />
              </svg>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={fromDate}
                onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
                className="py-2.5 px-3 rounded-xl border border-[#E8E2D5] dark:border-neutral-600 bg-white dark:bg-neutral-800 font-manrope text-sm text-[#1D1C16] dark:text-neutral-200"
              />
              <span className="text-[#43474D] dark:text-neutral-400 font-manrope text-sm">–</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => { setToDate(e.target.value); setPage(1); }}
                className="py-2.5 px-3 rounded-xl border border-[#E8E2D5] dark:border-neutral-600 bg-white dark:bg-neutral-800 font-manrope text-sm text-[#1D1C16] dark:text-neutral-200"
              />
            </div>
          </div>

          <div className="flex flex-col border border-[#E8E2D5] dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-[0_10px_30px_-10px_rgba(26,46,68,0.06)] dark:shadow-none rounded-lg overflow-hidden">
            {listLoading ? (
              <div className="py-16 text-center text-[#43474D] dark:text-neutral-400 font-manrope text-sm animate-pulse">
                {t('room_dashboard.loading')}
              </div>
            ) : listError ? (
              <div className="py-12 text-center text-red-600 dark:text-red-300 font-manrope text-sm">
                {listError}
              </div>
            ) : items.length === 0 ? (
              <div className="py-12 text-center text-[#43474D] dark:text-neutral-400 font-manrope text-sm">
                {t('room_dashboard.no_reservations')}
              </div>
            ) : (
              <div className="p-5 space-y-4 w-full">
                {items.map((item) => (
                  <button
                    key={item.reserveId}
                    onClick={() => void openDetail(item.reserveId)}
                    className="block w-full text-left cursor-pointer"
                    aria-label={t('room_dashboard.view_detail')}
                  >
                    <RoomHistoryCard
                      booking={toReservationFromItem(item)}
                      user={{ username: item.user.username, avatar: item.user.avatar }}
                    />
                  </button>
                ))}
              </div>
            )}

            <div className="px-5 pb-5">
              <BookTablePagination
                currentPage={pagination.page}
                totalPages={Math.max(1, pagination.totalPages)}
                onPageChange={(p) => setPage(p)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Calendar View (US3) */}
      {view === 'calendar' && (
        <div className="flex flex-col border border-[#E8E2D5] dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-[0_10px_30px_-10px_rgba(26,46,68,0.06)] dark:shadow-none rounded-lg overflow-hidden">
          <div className="flex justify-between items-center px-6 py-4 border-b border-[#E8E2D5] dark:border-neutral-700 flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <button onClick={() => navigateWeek(-1)} className="p-2 rounded-full hover:bg-[#F8F3E9] dark:hover:bg-neutral-700 transition-colors">
                <svg width="16" height="18" viewBox="0 0 16 18" fill="none"><path d="M10 14L5 9L10 4L11.2 5.2L7.4 9L11.2 12.8L10 14Z" fill="#43474D" className="dark:fill-neutral-300"/></svg>
              </button>
              <button onClick={() => navigateWeek(1)} className="p-2 rounded-full hover:bg-[#F8F3E9] dark:hover:bg-neutral-700 transition-colors">
                <svg width="16" height="18" viewBox="0 0 16 18" fill="none"><path d="M8.2 9L4.4 5.2L5.6 4L10.6 9L5.6 14L4.4 12.8L8.2 9Z" fill="#43474D" className="dark:fill-neutral-300"/></svg>
              </button>
              <div className="flex p-1 items-start rounded-full bg-[#F2EDE3] dark:bg-neutral-700">
                {(['week', 'day'] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => setCalendarView(v)}
                    className={`cursor-pointer py-1.5 px-5 rounded-full text-sm font-bold leading-5 transition-colors ${
                      calendarView === v
                        ? 'bg-white dark:bg-neutral-600 shadow-sm text-black dark:text-neutral-100'
                        : 'text-[#43474D] dark:text-neutral-400 hover:text-black dark:hover:text-neutral-200'
                    }`}
                  >
                    {v === 'week' ? t('room_dashboard.calendar_week') : t('room_dashboard.calendar_day')}
                  </button>
                ))}
              </div>
            </div>
            <div className="text-[#43474D] dark:text-neutral-300 font-manrope text-sm font-bold">
              {weekDays.length === 1
                ? t(`room_dashboard.day_${DAY_KEYS[weekDays[0].getDay()]}`) + ' - ' + weekDays[0].toLocaleDateString()
                : `${formatLocalDate(weekDays[0])} – ${formatLocalDate(weekDays[6])}`}
            </div>
          </div>

          {scheduleLoading ? (
            <div className="py-16 text-center text-[#43474D] dark:text-neutral-400 font-manrope text-sm animate-pulse">
              {t('room_dashboard.loading')}
            </div>
          ) : scheduleError ? (
            <div className="py-12 text-center text-red-600 dark:text-red-300 font-manrope text-sm">
              {scheduleError}
            </div>
          ) : rooms.length === 0 ? (
            <div className="py-12 text-center text-[#43474D] dark:text-neutral-400 font-manrope text-sm">
              {t('room_dashboard.no_rooms')}
            </div>
          ) : calendarView === 'day' ? (
            /* Day view: horizontal timeline — one row per room, time flows left to right */
            <div className="overflow-x-auto">
              <div className="min-w-[920px]">
                <div className="grid" style={{ gridTemplateColumns: `200px 1fr` }}>
                  <div className="bg-[#F8F3E9] dark:bg-neutral-900 p-3 border-b border-[#E8E2D5] dark:border-neutral-700 font-bold text-[11px] text-[#5A5E63] dark:text-neutral-300 font-hankenGrotesk tracking-wider uppercase">
                    {t('room_dashboard.table_room')}
                  </div>
                  <div className="relative bg-[#F8F3E9] dark:bg-neutral-900 border-b border-[#E8E2D5] dark:border-neutral-700" style={{ height: 42 }}>
                    {/* <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-hankenGrotesk font-bold tracking-[0.1em] text-[#8B8E93] dark:text-neutral-500 uppercase">
                      {t(`room_dashboard.day_${DAY_KEYS[weekDays[0].getDay()]}`)} · {weekDays[0].getDate()}
                    </span> */}
                    {Array.from({ length: gridSteps }, (_, i) => i).map((i) => (
                      <span
                        key={i}
                        className="absolute top-1/2 -translate-y-1/2 text-[10px] font-semibold text-[#8B8E93] dark:text-neutral-400 font-hankenGrotesk"
                        style={{ left: `${(i / gridSteps) * 100}%`, transform: 'translate(-50%, -50%)' }}
                      >
                        {fmtHM(windowStart + i * stepMin)}
                      </span>
                    ))}
                  </div>

                  {rooms.map((room) => {
                    const dayEvents = (eventsByRoomAndDate[`${room.roomId}|${formatLocalDate(weekDays[0])}`] || [])
                      .sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime));
                    return (
                      <Fragment key={room.roomId}>
                        <div className="p-3 border-b border-r border-[#E8E2D5] dark:border-neutral-700 bg-white dark:bg-neutral-800 flex items-center gap-3">
                          <div className="relative w-14 h-14 rounded-xl overflow-hidden ring-1 ring-black/5 dark:ring-white/10 shrink-0 shadow-sm">
                            {room.imgUrl ? (
                              <img src={room.imgUrl} alt={room.roomName} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-[#F8F3E9] to-[#EDE2CE] dark:from-neutral-700 dark:to-neutral-800 flex items-center justify-center">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[#C9BFA8] dark:text-neutral-500">
                                  <rect x="3" y="3" width="18" height="18" rx="3" />
                                  <path d="M3 10h18" />
                                </svg>
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[#1D1C16] dark:text-neutral-100 font-manrope text-[13px] font-bold leading-tight truncate">{room.roomName}</p>
                            <p className="mt-0.5 text-[10px] text-[#75777D] dark:text-neutral-400 font-manrope truncate">{room.capacity} seats</p>
                          </div>
                        </div>
                        <div className="relative border-b border-r border-[#E8E2D5] dark:border-neutral-700 bg-[#FDFCF9] dark:bg-neutral-800" style={{ height: 84 }}>
                          {Array.from({ length: gridSteps }, (_, i) => i).map((i) => (
                            <div key={i} className={`absolute top-0 bottom-0 ${i % 2 === 0 ? 'bg-[#F8F3E9]/50 dark:bg-neutral-900/40' : ''}`} style={{ left: `${(i / gridSteps) * 100}%`, width: `${(1 / gridSteps) * 100}%` }} />
                          ))}
                          {Array.from({ length: gridSteps + 1 }, (_, i) => i).map((i) => {
                            if (i === 0) return null;
                            return (
                              <div
                                key={i}
                                className="absolute top-0 bottom-0 border-l border-[#F1EBDD] dark:border-neutral-700"
                                style={{ left: `${(i / gridSteps) * 100}%` }}
                              />
                            );
                          })}
                          {formatLocalDate(weekDays[0]) === todayStr && (
                            <div className="absolute top-0 bottom-0 z-10 pointer-events-none" style={{ left: `${nowLineLeft}%` }}>
                              <div className="absolute top-0 bottom-0 w-px bg-[#D93025]/70" />
                              <div className="absolute -top-1 -left-[5px] w-2.5 h-2.5 rounded-full bg-[#D93025] ring-2 ring-white dark:ring-neutral-900" />
                            </div>
                          )}
                          {dayEvents.map((ev) => {
                            const start = Math.max(toMinutes(ev.startTime), windowStart);
                            const end = Math.min(toMinutes(ev.endTime), windowStart + windowMinutes);
                            const left = ((start - windowStart) / windowMinutes) * 100;
                            const width = Math.max(4, ((end - start) / windowMinutes) * 100);
                            const st = statusBlockStyles(ev.status);
                            return (
                              <button
                                key={ev.reserveId}
                                onClick={() => void openDetail(ev.reserveId)}
                                className={`absolute top-1.5 bottom-1.5 rounded-lg border shadow-sm hover:shadow-md hover:brightness-105 active:brightness-95 transition-all text-left overflow-hidden group ${st.block}`}
                                style={{ left: `${left}%`, width: `${width}%` }}
                              >
                                <span className={`absolute left-0 top-0 bottom-0 w-1 ${st.accent}`} />
                                <span className="block pl-2.5 pr-1.5 pt-1 text-[10px] font-bold leading-tight truncate drop-shadow-[0_1px_1px_rgba(0,0,0,0.15)]">{ev.title}</span>
                                <span className="block pl-2.5 pr-1.5 pb-1 text-[9px] font-semibold opacity-90 truncate">{formatTime(ev.startTime)}–{formatTime(ev.endTime)}</span>
                              </button>
                            );
                          })}
                        </div>
                      </Fragment>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* Week view: vertical timeline — one row per room, each room-day cell has a vertical time axis */
            <div className="overflow-x-auto">
              <div className="min-w-[1088px]">
                <div className="grid" style={{ gridTemplateColumns: `48px 176px repeat(7, minmax(124px, 1fr))` }}>
                  <div className="bg-[#F8F3E9] dark:bg-neutral-900 border-b border-r border-[#E8E2D5] dark:border-neutral-700" />
                  <div className="bg-[#F8F3E9] dark:bg-neutral-900 p-3 border-b border-r border-[#E8E2D5] dark:border-neutral-700 font-bold text-[11px] text-[#5A5E63] dark:text-neutral-300 font-hankenGrotesk tracking-wider uppercase">
                    {t('room_dashboard.table_room')}
                  </div>
                  {weekDays.map((d, i) => {
                    const dateStr = formatLocalDate(d);
                    const today = dateStr === todayStr;
                    return (
                      <div key={dateStr} className={`bg-[#F8F3E9] dark:bg-neutral-900 p-2.5 text-center border-b border-r border-[#E8E2D5] dark:border-neutral-700 ${today ? 'bg-[#F1EADA] dark:bg-neutral-800' : ''}`}>
                        <div className="text-[10px] font-hankenGrotesk font-bold tracking-[0.1em] text-[#8B8E93] dark:text-neutral-500 uppercase">
                          {t(`room_dashboard.day_${DAY_KEYS[d.getDay()]}`)}
                        </div>
                        <div className={`inline-flex items-center justify-center w-7 h-7 rounded-full mt-1 ${today ? 'bg-black dark:bg-neutral-100 shadow-[0_2px_8px_rgba(0,0,0,0.25)]' : ''}`}>
                          <span className={`font-hankenGrotesk text-sm font-bold leading-4 ${today ? 'text-white dark:text-black' : 'text-[#1D1C16] dark:text-neutral-300'}`}>
                            {d.getDate()}
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  {rooms.map((room) => (
                    <Fragment key={room.roomId}>
                      <div className="relative border-b border-r border-[#E8E2D5] dark:border-neutral-700 bg-[#FDFCF9] dark:bg-neutral-800" style={{ height: weekCellHeight }}>
                        {Array.from({ length: gridSteps }, (_, i) => i).map((i) => (
                          <span
                            key={i}
                            className={`absolute right-1.5 text-[9px] font-semibold text-[#8B8E93] dark:text-neutral-400 font-hankenGrotesk ${i === 0 ? '-translate-y-1' : i === gridSteps - 1 ? '-translate-y-full' : '-translate-y-1/2'}`}
                            style={{ top: `${(i / gridSteps) * 100}%` }}
                          >
                            {fmtHM(windowStart + i * stepMin)}
                          </span>
                        ))}
                      </div>
                      <div className="p-2.5 border-b border-r border-[#E8E2D5] dark:border-neutral-700 bg-white dark:bg-neutral-800 flex items-center gap-2.5" style={{ height: weekCellHeight }}>
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden ring-1 ring-black/5 dark:ring-white/10 shrink-0 shadow-sm">
                          {room.imgUrl ? (
                            <img src={room.imgUrl} alt={room.roomName} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-[#F8F3E9] to-[#EDE2CE] dark:from-neutral-700 dark:to-neutral-800 flex items-center justify-center">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[#C9BFA8] dark:text-neutral-500">
                                <rect x="3" y="3" width="18" height="18" rx="3" />
                                <path d="M3 10h18" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[#1D1C16] dark:text-neutral-100 font-manrope text-[12px] font-bold leading-tight truncate">{room.roomName}</p>
                          <p className="mt-0.5 text-[9px] text-[#75777D] dark:text-neutral-400 font-manrope truncate">{room.capacity} seats</p>
                        </div>
                      </div>
                      {weekDays.map((d) => {
                        const dateStr = formatLocalDate(d);
                        const roomEvents = (eventsByRoomAndDate[`${room.roomId}|${dateStr}`] || []).sort(
                          (a, b) => toMinutes(a.startTime) - toMinutes(b.startTime)
                        );
                        return (
                          <div key={`${room.roomId}-${dateStr}`} className="relative border-b border-r border-[#E8E2D5] dark:border-neutral-700 bg-[#FDFCF9] dark:bg-neutral-800" style={{ height: weekCellHeight }}>
                            {Array.from({ length: gridSteps }, (_, i) => i).map((i) => (
                              <div key={i} className={`absolute left-0 right-0 ${i % 2 === 0 ? 'bg-[#F8F3E9]/50 dark:bg-neutral-900/40' : ''}`} style={{ top: `${(i / gridSteps) * 100}%`, height: `${(1 / gridSteps) * 100}%` }} />
                            ))}
                            {Array.from({ length: gridSteps + 1 }, (_, i) => i).map((i) => (
                              <div key={i} className="absolute left-0 right-0 border-t border-[#F1EBDD] dark:border-neutral-700" style={{ top: `${(i / gridSteps) * 100}%` }} />
                            ))}
                            {dateStr === todayStr && (
                              <div className="absolute left-0 right-0 z-10 pointer-events-none" style={{ top: `${nowLineLeft}%` }}>
                                <div className="absolute left-0 right-0 h-px bg-[#D93025]/70" />
                                <div className="absolute -left-1 -top-[5px] w-2.5 h-2.5 rounded-full bg-[#D93025] ring-2 ring-white dark:ring-neutral-900" />
                              </div>
                            )}
                            {roomEvents.map((ev) => {
                              const start = Math.max(toMinutes(ev.startTime), windowStart);
                              const end = Math.min(toMinutes(ev.endTime), windowStart + windowMinutes);
                              const top = ((start - windowStart) / windowMinutes) * 100;
                              const height = Math.max(7, ((end - start) / windowMinutes) * 100);
                              const st = statusBlockStyles(ev.status);
                              return (
                                <button
                                  key={ev.reserveId}
                                  onClick={() => void openDetail(ev.reserveId)}
                                  className={`absolute left-1 right-1 rounded-lg border shadow-sm hover:shadow-md hover:brightness-105 active:brightness-95 transition-all text-left overflow-hidden group ${st.block}`}
                                  style={{ top: `${top}%`, height: `${height}%` }}
                                >
                                  <span className={`absolute left-0 top-0 bottom-0 w-1 ${st.accent}`} />
                                  <span className="block pl-2 pr-1 pt-1 text-[10px] font-bold leading-tight truncate drop-shadow-[0_1px_1px_rgba(0,0,0,0.15)]">{ev.title}</span>
                                  {height >= 16 && (
                                    <span className="block pl-2 pr-1 pb-1 text-[9px] font-semibold opacity-90 truncate">{formatTime(ev.startTime)}–{formatTime(ev.endTime)}</span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        );
                      })}
                    </Fragment>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Read-only Detail Panel (US4) */}
      {(detailLoading || detailError || detail) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => { setDetail(null); setDetailError(null); }}>
          <div className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl bg-white dark:bg-neutral-800 p-6 shadow-xl flex flex-col gap-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center">
              <h3 className="text-[#03192E] dark:text-neutral-100 font-inter text-xl font-bold leading-7">
                {t('room_dashboard.detail_title')}
              </h3>
              <button
                onClick={() => { setDetail(null); setDetailError(null); }}
                className="p-2 rounded-full text-[#43474D] dark:text-neutral-300 hover:bg-[#F8F3E9] dark:hover:bg-neutral-700 transition-colors"
                aria-label={t('room_dashboard.close')}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            </div>

            {detailLoading ? (
              <div className="py-12 text-center text-[#43474D] dark:text-neutral-400 font-manrope text-sm animate-pulse">
                {t('room_dashboard.loading')}
              </div>
            ) : detailError ? (
              <div className="py-8 text-center text-red-600 dark:text-red-300 font-manrope text-sm">{detailError}</div>
            ) : detail ? (
              <>
                <RoomHistoryCard booking={toReservation(detail)} />

                <div className="flex items-center gap-4 p-4 rounded-xl bg-[#F8F3E9] dark:bg-neutral-900">
                  <span className="shrink-0 w-12 h-12 rounded-full overflow-hidden bg-[#2F6FA3] dark:bg-sky-900 text-white flex items-center justify-center font-bold text-sm uppercase ring-2 ring-white/70 dark:ring-black/20">
                    {detail.user.avatar ? (
                      <img src={detail.user.avatar} alt={detail.user.username} className="w-full h-full object-cover" />
                    ) : (
                      detail.user.username ? detail.user.username.slice(0, 2) : 'U'
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[#1D1C16] dark:text-neutral-100 font-bold truncate">{detail.user.username}</p>
                    <p className="text-[#43474D] dark:text-neutral-400 text-sm truncate">{detail.user.email}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#75777D] dark:text-neutral-400 block">
                      {t('room_dashboard.detail_user')}
                    </span>
                    {detail.user.phoneNumber && (
                      <p className="text-[#43474D] dark:text-neutral-400 text-sm mt-0.5">{detail.user.phoneNumber}</p>
                    )}
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
