"use client";

import { useState, useEffect } from 'react';
import { UpcomingAgenda } from '../../components/organisms';
import { DashboardCalendar } from '../../components/molecules';
import { getLoggedInUser } from '../../utils/user';
import { useI18n } from '../../providers/I18nProvider';
import { apiFetch } from '../../utils/apiClient';
import { listCreatedStudyGroups, listJoinedStudyGroups } from '../../utils/studyGroup';
import { localizedBranchName, localizedRoomName } from '../../utils/room';
import type { Reservation } from '../../components/molecules/ReservationCard';

interface EventItem {
  id: number | string;
  title: string;
  time: string;
  location: string;
  type: string;
  date: string;
}

interface BorrowRecord {
  id: string;
  title: string;
  reserveDate?: string;
  dueDate?: string;
  status: string;
}

export default function UserDashboardPage() {
  const { t } = useI18n();
  const user = getLoggedInUser();
  const [allEvents, setAllEvents] = useState<EventItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [borrowedRes, reservationsResult, createdResult, joinedResult] = await Promise.all([
          apiFetch<{ current: BorrowRecord[] }>('/dashboard/user/my-borrowed'),
          apiFetch<{ upcoming: Reservation[]; past: Reservation[] }>('/api/rooms/user-reservations'),
          listCreatedStudyGroups({ page: 1, pageSize: 50 }),
          listJoinedStudyGroups({ page: 1, pageSize: 50 }),
        ]);

        const borrowedData = borrowedRes.success ? borrowedRes.data : undefined;

        const reservationEvents: EventItem[] = (borrowedData?.current || [])
          .filter((record: BorrowRecord) => {
            if (['reserved', 'pending'].includes(record.status)) return !!record.reserveDate;
            if (record.status === 'borrowed') return !!record.dueDate;
            return false;
          })
          .map((record: BorrowRecord) => {
            let dateStr: string;
            let title: string;
            let type: string;

            if (['reserved', 'pending'].includes(record.status)) {
              const dueDate = new Date(new Date(record.reserveDate!).getTime() + 7 * 24 * 60 * 60 * 1000);
              dateStr = `${dueDate.getFullYear()}-${String(dueDate.getMonth() + 1).padStart(2, '0')}-${String(dueDate.getDate()).padStart(2, '0')}`;
              title = `Pickup due: ${record.title}`;
              type = 'reservation_expiry';
            } else {
              const d = new Date(record.dueDate!);
              dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
              title = `Return due: ${record.title}`;
              type = 'borrow_due';
            }

            return {
              id: parseInt(record.id.replace(/-/g, '').slice(0, 8), 16),
              title,
              time: '',
              location: '',
              type,
              date: dateStr,
            };
          });

        const createdGroups = createdResult.success ? createdResult.data || [] : [];
        const joinedGroups = joinedResult.success
          ? (joinedResult.data || []).filter((item) => item.participation.status === 'approved').map((item) => item.group)
          : [];
        const studyGroups = [...new Map([...createdGroups, ...joinedGroups].map((group) => [group.groupId, group])).values()];
        const studyGroupReservationIds = new Set(studyGroups.map((group) => group.reservation.reserveId));
        const studyGroupEvents: EventItem[] = studyGroups.map((group) => ({
          id: `study-group-${group.groupId}`,
          title: group.title,
          time: `${group.reservation.startTime.slice(0, 5)} - ${group.reservation.endTime.slice(0, 5)}`,
          location: `${localizedBranchName(t, group.reservation.room.branchId, group.reservation.room.branchName)} · ${localizedRoomName(t, group.reservation.room.roomId, group.reservation.room.roomName)}`,
          type: 'room_reservation',
          date: String(group.reservation.startDate).slice(0, 10),
        }));
        const roomReservations = reservationsResult.success && reservationsResult.data
          ? [...(reservationsResult.data.upcoming || []), ...(reservationsResult.data.past || [])]
          : [];
        const roomReservationEvents: EventItem[] = roomReservations
          .filter((reservation) => !studyGroupReservationIds.has(reservation.reserveId))
          .map((reservation) => ({
            id: `room-reservation-${reservation.reserveId}`,
            title: localizedRoomName(t, reservation.roomId, reservation.roomName),
            time: `${reservation.startTime.slice(0, 5)} - ${reservation.endTime.slice(0, 5)}`,
            location: localizedBranchName(t, reservation.branchId, reservation.branchName),
            type: 'room_reservation',
            date: String(reservation.startDate).slice(0, 10),
          }));

        setAllEvents([...reservationEvents, ...studyGroupEvents, ...roomReservationEvents]);
      } catch {
        // silently fail; UI shows empty state
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [t]);

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const tomorrowDate = new Date(today);
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowStr = `${tomorrowDate.getFullYear()}-${String(tomorrowDate.getMonth() + 1).padStart(2, '0')}-${String(tomorrowDate.getDate()).padStart(2, '0')}`;

  const todayEvents = allEvents.filter((e) => e.date === todayStr);
  const tomorrowEvents = allEvents.filter((e) => e.date === tomorrowStr);

  const calendarEvents = allEvents.map((e) => ({
    date: e.date,
    type: e.type,
    title: e.title,
  }));

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="font-manrope text-[40px] font-bold leading-[54.5px] text-black dark:text-neutral-100">
          {t('dashboard.welcome', { name: user?.username || 'User' })}
        </h1>
      </div>
      <div className="flex gap-8 items-start">
        <div className="flex-1 min-w-0">
          <DashboardCalendar events={calendarEvents} />
        </div>
        <UpcomingAgenda
          today={todayEvents}
          tomorrow={tomorrowEvents}
          isLoading={isLoading}
        />
      </div>
    </>
  );
}
