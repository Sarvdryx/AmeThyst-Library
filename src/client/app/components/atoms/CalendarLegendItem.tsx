interface CalendarLegendItemProps {
  label: string;
  color: string;
}

export default function CalendarLegendItem({ label, color }: CalendarLegendItemProps) {
  return (
    <div className="flex items-center gap-2">
      <div className={`rounded-full w-3 h-3 ${color}`} />
      <span className="text-[#43474D] dark:text-neutral-400 font-manrope text-xs font-medium leading-4">
        {label}
      </span>
    </div>
  );
}
