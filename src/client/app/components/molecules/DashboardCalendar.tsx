"use client";

import { useState, useMemo, useCallback } from 'react';
import { useI18n } from '../../providers/I18nProvider';
import { CalendarDayCell, CalendarLegendItem, CalendarEventDot } from '../atoms';

interface CalendarEvent {
  date: string;
  type: string;
  title: string;
}

interface DashboardCalendarProps {
  events?: CalendarEvent[];
  onMonthChange?: (month: number, year: number) => void;
}

type ViewMode = 'month' | 'week' | 'day';

const dayKeys = ['calendar_mon', 'calendar_tue', 'calendar_wed', 'calendar_thu', 'calendar_fri', 'calendar_sat', 'calendar_sun'];
const monthKeys = ['calendar_month_january', 'calendar_month_february', 'calendar_month_march', 'calendar_month_april', 'calendar_month_may', 'calendar_month_june', 'calendar_month_july', 'calendar_month_august', 'calendar_month_september', 'calendar_month_october', 'calendar_month_november', 'calendar_month_december'];
const dayShortKeys = ['calendar_day_mon_short', 'calendar_day_tue_short', 'calendar_day_wed_short', 'calendar_day_thu_short', 'calendar_day_fri_short', 'calendar_day_sat_short', 'calendar_day_sun_short'];

function getMonthGrid(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const startDay = firstDay.getDay();
  const startOffset = startDay === 0 ? 6 : startDay - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const grid: (number | null)[] = [];
  for (let i = 0; i < startOffset; i++) grid.push(null);
  for (let d = 1; d <= daysInMonth; d++) grid.push(d);
  while (grid.length % 7 !== 0) grid.push(null);
  return grid;
}

function getWeekStart(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

function formatDate(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export default function DashboardCalendar({ events = [], onMonthChange }: DashboardCalendarProps) {
  const { t } = useI18n();
  const today = useMemo(() => new Date(), []);
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [view, setView] = useState<ViewMode>('month');

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const grid = useMemo(() => getMonthGrid(year, month), [year, month]);

  const navigate = useCallback((dir: -1 | 1) => {
    let d: Date;
    if (view === 'month') {
      d = new Date(year, month + dir, 1);
      setViewDate(d);
      onMonthChange?.(d.getMonth() + 1, d.getFullYear());
    } else if (view === 'week') {
      const start = getWeekStart(viewDate);
      start.setDate(start.getDate() + 7 * dir);
      d = start;
      setViewDate(d);
    } else {
      d = new Date(year, month, viewDate.getDate() + dir);
      setViewDate(d);
    }
  }, [view, year, month, viewDate, onMonthChange]);

  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    events.forEach((ev) => {
      if (!map[ev.date]) map[ev.date] = [];
      map[ev.date].push(ev);
    });
    return map;
  }, [events]);

  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-xl p-8 flex flex-col gap-2 w-full">
      <div className="flex justify-between items-center pb-6">
        <div className="flex min-w-0 items-center gap-6">
          <h3 className="w-[280px] shrink-0 truncate font-manrope text-xl font-bold text-black dark:text-neutral-100">
            {view === 'month' && `${t(`dashboard.${monthKeys[month]}`)} ${year}`}
            {view === 'week' && (() => {
              const start = getWeekStart(viewDate);
              const end = new Date(start);
              end.setDate(end.getDate() + 6);
              if (start.getMonth() === end.getMonth()) {
                return `${t(`dashboard.${monthKeys[start.getMonth()]}`)} ${start.getDate()} – ${end.getDate()}, ${start.getFullYear()}`;
              }
              return `${t(`dashboard.${monthKeys[start.getMonth()]}`)} ${start.getDate()} – ${t(`dashboard.${monthKeys[end.getMonth()]}`)} ${end.getDate()}, ${end.getFullYear()}`;
            })()}
            {view === 'day' && `${t(`dashboard.${dayShortKeys[viewDate.getDay() === 0 ? 6 : viewDate.getDay() - 1]}`)}, ${t(`dashboard.${monthKeys[month]}`)} ${viewDate.getDate()}, ${year}`}
          </h3>
          <div className="flex p-1 items-center rounded-full bg-[#F2EDE3] dark:bg-neutral-700">
            <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-white/50 dark:hover:bg-neutral-600 transition-colors">
              <svg width="24" height="28" viewBox="0 0 24 28" fill="none"><path d="M14 20L8 14L14 8L15.4 9.4L10.8 14L15.4 18.6L14 20Z" fill="#43474D" className="dark:fill-neutral-300"/></svg>
            </button>
            <button onClick={() => navigate(1)} className="p-2 rounded-full hover:bg-white/50 dark:hover:bg-neutral-600 transition-colors">
              <svg width="24" height="28" viewBox="0 0 24 28" fill="none"><path d="M12.6 14L8 9.4L9.4 8L15.4 14L9.4 20L8 18.6L12.6 14Z" fill="#43474D" className="dark:fill-neutral-300"/></svg>
            </button>
          </div>
        </div>
        <div className="flex p-1 items-start rounded-full bg-[#F2EDE3] dark:bg-neutral-700">
          {(['month', 'week', 'day'] as const).map((v) => (
            <button
              key={v}
              onClick={() => {
                if (v === 'week') setViewDate(getWeekStart(today));
                else if (v === 'day') setViewDate(new Date(today.getFullYear(), today.getMonth(), today.getDate()));
                else setViewDate(new Date(today.getFullYear(), today.getMonth(), 1));
                setView(v);
              }}
              className={`cursor-pointer py-1.5 px-5 rounded-full text-sm font-bold leading-5 transition-colors ${
                view === v
                  ? 'bg-white dark:bg-neutral-600 shadow-sm text-black dark:text-neutral-100'
                  : 'text-[#43474D] dark:text-neutral-400 hover:text-black dark:hover:text-neutral-200'
              }`}
            >
              {v === 'month' ? t('dashboard.calendar_month') : v === 'week' ? t('dashboard.calendar_week') : t('dashboard.calendar_day')}
            </button>
          ))}
        </div>
      </div>

      {view === 'month' && (
        <>
          <div className="grid grid-cols-7 pb-4 border-b border-[#E8E2D5] dark:border-neutral-700">
            {dayKeys.map((key) => (
              <div key={key} className="text-center">
                <span className="text-[rgba(67,71,77,0.60)] dark:text-neutral-500 font-hankenGrotesk text-[10px] leading-[15px] tracking-[0.1em]">
                  {t(`dashboard.${key}`)}
                </span>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {grid.map((day, idx) => {
              if (day === null) {
                return <div key={`empty-${idx}`} className="h-32 border-b border-[#E8E2D5] dark:border-neutral-700" />;
              }
              const dateStr = formatDate(year, month, day);
              const isToday = dateStr === todayStr;
              const dayEvents = eventsByDate[dateStr] || [];
              return (
                <CalendarDayCell
                  key={dateStr}
                  day={day}
                  isToday={isToday}
                  events={dayEvents}
                />
              );
            })}
          </div>
          <div className="flex items-center gap-6 pt-6 border-t border-[#E8E2D5] dark:border-neutral-700 flex-wrap">
            {[
              { label: t('dashboard.legend_pickup_due'), color: 'bg-[#E37400]' },
              { label: t('dashboard.legend_return_due'), color: 'bg-[#061D32]' },
              { label: t('dashboard.legend_room_reservation'), color: 'bg-[#2F6FA3]' },
            ].map((item) => (
              <CalendarLegendItem key={item.label} label={item.label} color={item.color} />
            ))}
          </div>
        </>
      )}

      {view === 'week' && (() => {
        const start = getWeekStart(viewDate);
        const days: Date[] = [];
        for (let i = 0; i < 7; i++) {
          const d = new Date(start);
          d.setDate(d.getDate() + i);
          days.push(d);
        }
        return (
          <>
            <div className="grid grid-cols-7 pb-4 border-b border-[#E8E2D5] dark:border-neutral-700">
              {days.map((d, i) => {
                const ds = formatDate(d.getFullYear(), d.getMonth(), d.getDate());
                const isToday = ds === todayStr;
                return (
                  <div key={i} className="text-center flex flex-col items-center gap-1">
                    <span className="text-[rgba(67,71,77,0.60)] dark:text-neutral-500 font-hankenGrotesk text-[10px] leading-[15px] tracking-[0.1em]">
                      {t(`dashboard.${dayShortKeys[i]}`)}
                    </span>
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full ${isToday ? 'bg-black dark:bg-neutral-100' : ''}`}>
                      <span className={`font-hankenGrotesk text-sm font-bold leading-4 ${isToday ? 'text-white dark:text-black' : 'text-[#1D1C16] dark:text-neutral-300'}`}>
                        {d.getDate()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex flex-col gap-4 py-4">
              {(() => {
                let hasEvents = false;
                const rows = days.map((d) => {
                  const ds = formatDate(d.getFullYear(), d.getMonth(), d.getDate());
                  const dayEvents = eventsByDate[ds] || [];
                  if (dayEvents.length > 0) hasEvents = true;
                  return { date: ds, events: dayEvents, day: d.getDate() };
                });
                if (!hasEvents) {
                  return (
                    <div className="py-16 text-center text-neutral-400 dark:text-neutral-500 font-manrope text-sm">
                      {t('dashboard.calendar_no_events_week')}
                    </div>
                  );
                }
                return rows.map((row) =>
                  row.events.length > 0 ? (
                    <div key={row.date} className="flex items-start gap-4">
                      <span className="w-10 shrink-0 text-right text-[#43474D] dark:text-neutral-400 font-manrope text-xs font-bold leading-5 pt-0.5">
                        {row.day}
                      </span>
                      <div className="flex-1 flex flex-col gap-2">
                        {row.events.map((ev, i) => (
                          <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-[#F8F3E9] dark:bg-neutral-700/50">
                            <CalendarEventDot type={ev.type} />
                            <span className="text-black dark:text-neutral-100 font-manrope text-sm font-medium">{ev.title}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null
                );
              })()}
            </div>
          </>
        );
      })()}

      {view === 'day' && (() => {
        const ds = formatDate(year, month, viewDate.getDate());
        const isToday = ds === todayStr;
        const dayEvents = eventsByDate[ds] || [];
        return (
          <>
            <div className="pb-4 border-b border-[#E8E2D5] dark:border-neutral-700 text-center">
              <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full mb-2 ${isToday ? 'bg-black dark:bg-neutral-100' : ''}`}>
                <span className={`font-hankenGrotesk text-lg font-bold ${isToday ? 'text-white dark:text-black' : 'text-[#1D1C16] dark:text-neutral-300'}`}>
                  {viewDate.getDate()}
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-3 py-4">
              {dayEvents.length === 0 ? (
                <div className="py-16 text-center text-neutral-400 dark:text-neutral-500 font-manrope text-sm">
                  {t('dashboard.calendar_no_events_day')}
                </div>
              ) : (
                dayEvents.map((ev, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-lg bg-[#F8F3E9] dark:bg-neutral-700/50">
                    <CalendarEventDot type={ev.type} size="md" />
                    <div className="flex flex-col gap-0.5">
                      <span className="text-black dark:text-neutral-100 font-manrope text-sm font-bold">{ev.title}</span>
                      <span className="text-[#75777D] dark:text-neutral-400 font-manrope text-xs">{ev.type.replace('_', ' ')}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        );
      })()}
    </div>
  );
}
