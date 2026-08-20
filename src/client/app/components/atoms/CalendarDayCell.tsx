import CalendarEventBadge from './CalendarEventBadge';

interface CalendarEvent {
  date: string;
  type: string;
  title: string;
}

interface CalendarDayCellProps {
  day: number;
  isToday: boolean;
  events: CalendarEvent[];
}

export default function CalendarDayCell({ day, isToday, events }: CalendarDayCellProps) {
  return (
    <div
      className={`h-32 p-2 border-r border-b border-[#E8E2D5] dark:border-neutral-700 flex flex-col items-start gap-1 overflow-hidden ${
        isToday ? 'bg-[rgba(248,243,233,0.50)] dark:bg-neutral-700/50' : ''
      }`}
    >
      <div className={`flex items-center justify-center w-7 h-7 rounded-full ${isToday ? 'bg-black dark:bg-neutral-100' : ''}`}>
        <span className={`font-hankenGrotesk text-xs font-bold leading-4 ${isToday ? 'text-white dark:text-black' : 'text-[#1D1C16] dark:text-neutral-300'}`}>
          {day}
        </span>
      </div>
      {events.slice(0, 2).map((ev, i) => (
        <CalendarEventBadge key={i} title={ev.title} type={ev.type} />
      ))}
      {events.length > 2 && (
        <span className="text-[#43474D] dark:text-neutral-400 font-manrope text-[10px] font-bold leading-[15px]">
          +{events.length - 2}
        </span>
      )}
    </div>
  );
}
