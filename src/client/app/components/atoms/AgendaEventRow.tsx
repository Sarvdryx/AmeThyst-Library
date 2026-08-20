import CalendarEventDot from './CalendarEventDot';

interface AgendaEventRowProps {
  time: string;
  title: string;
  location?: string;
  type: string;
  allDayLabel?: string;
}

export default function AgendaEventRow({ time, title, location, type, allDayLabel }: AgendaEventRowProps) {
  return (
    <div className="flex items-start gap-4">
      <div className="pt-1 w-12 shrink-0">
        <span className="text-[rgba(67,71,77,0.60)] dark:text-neutral-400 font-manrope text-[10px] font-bold leading-[15px]">
          {time || allDayLabel}
        </span>
      </div>
      <div className="flex items-start gap-3 min-w-0">
        <CalendarEventDot type={type} />
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-black dark:text-neutral-100 font-manrope text-sm font-bold leading-[17.5px] truncate">
            {title}
          </span>
          {location && (
            <span className="text-[rgba(67,71,77,0.70)] dark:text-neutral-400 font-manrope text-xs leading-4 truncate">
              {location}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
