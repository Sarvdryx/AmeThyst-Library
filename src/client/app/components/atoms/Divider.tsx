interface DividerProps {
  label?: string;
  className?: string;
}

export default function Divider({ label, className }: DividerProps) {
  if (!label) {
    return <div className={`flex-1 h-px bg-[#C5C6CD] dark:bg-neutral-600 ${className || ''}`} />;
  }

  return (
    <div className={`flex items-center gap-4 my-2 ${className || ''}`}>
      <div className="flex-1 h-px bg-[#C5C6CD] dark:bg-neutral-600" />
      <span className="text-[#45474C] dark:text-neutral-400 text-xs font-medium tracking-[0.02em]">{label}</span>
      <div className="flex-1 h-px bg-[#C5C6CD] dark:bg-neutral-600" />
    </div>
  );
}
