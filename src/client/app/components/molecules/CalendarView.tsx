"use client";

import DashboardCalendar from './DashboardCalendar';

const mockEvents = [
  { date: new Date().toISOString().split('T')[0], type: 'borrow_due' as const, title: 'Return Due' },
  { date: new Date(Date.now() + 86400000).toISOString().split('T')[0], type: 'reservation_expiry' as const, title: 'Pickup Due' },
  { date: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0], type: 'room_reservation' as const, title: 'Room Reservation' },
];

export default function CalendarView() {
  return (
    <div className="w-full">
      <DashboardCalendar events={mockEvents} />
    </div>
  );
}
