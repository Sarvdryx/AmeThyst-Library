interface CalendarEventBadgeProps {
  title: string;
  type: string;
}

const typeColors: Record<string, string> = {
  borrow_due: 'bg-[#061D32]',
  room_reservation: 'bg-[#2F6FA3]',
  reservation_expiry: 'bg-[#E37400]',
};

export default function CalendarEventBadge({ title, type }: CalendarEventBadgeProps) {
  const color = typeColors[type] || 'bg-neutral-400';

  return (
    <span className={`${color} text-white dark:text-black text-[10px] leading-[15px] px-2 py-0.5 rounded-full truncate w-full`}>
      {title}
    </span>
  );
}
