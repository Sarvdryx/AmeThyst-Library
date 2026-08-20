interface CapacityBarProps {
  current: number;
  max: number;
  barColor?: string;
  bgColor?: string;
  showLabel?: boolean;
}

export default function CapacityBar({
  current,
  max,
  barColor = 'bg-[#091426] dark:bg-[#D4B895]',
  bgColor = 'bg-[#E6EEFF] dark:bg-neutral-700',
  showLabel = true,
}: CapacityBarProps) {
  const percent = Math.min(100, Math.round((current / max) * 100));

  return (
    <div className="flex flex-col items-end gap-2">
      {showLabel && (
        <p className="text-[#45464D] dark:text-gray-400 font-inter text-xs font-semibold leading-3 tracking-wider uppercase">
          CAPACITY
        </p>
      )}
      <div className="flex items-center gap-3">
        <div className={`w-32 h-2 rounded-full ${bgColor} overflow-hidden relative`}>
          <div
            className={`absolute left-0 top-0 h-full rounded-full ${barColor} transition-all duration-500`}
            style={{ width: `${percent}%` }}
          />
        </div>
        {showLabel && (
          <p className="text-[#000] dark:text-white font-inter text-sm font-bold leading-relaxed">
            {current} of {max} filled
          </p>
        )}
      </div>
    </div>
  );
}
