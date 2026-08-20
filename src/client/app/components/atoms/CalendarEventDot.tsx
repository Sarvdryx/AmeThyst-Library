interface CalendarEventDotProps {
  type: string;
  size?: 'sm' | 'md';
}

const typeDots: Record<string, string> = {
  borrow_due: 'bg-[#061D32]',
  room_reservation: 'bg-[#2F6FA3]',
  reservation_expiry: 'bg-[#E37400]',
};

const sizes = {
  sm: 'w-2 h-2',
  md: 'w-3 h-3',
};

export default function CalendarEventDot({ type, size = 'sm' }: CalendarEventDotProps) {
  const color = typeDots[type] || 'bg-neutral-400';
  return (
    <div className={`${sizes[size]} rounded-full shrink-0 ${color}`} />
  );
}
