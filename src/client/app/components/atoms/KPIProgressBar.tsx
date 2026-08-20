"use client";

interface KPIProgressBarProps {
  value: number;
  color?: string;
  bgColor?: string;
  height?: string;
  className?: string;
}

export default function KPIProgressBar({
  value,
  color = 'bg-[#091426]',
  bgColor = 'bg-[#F2EDE3]',
  height = 'h-1',
  className = '',
}: KPIProgressBarProps) {
  return (
    <div className={`w-full ${height} ${bgColor} rounded-full overflow-hidden ${className}`}>
      <div
        className={`${height} ${color} rounded-full transition-all duration-500`}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}
