"use client";

import KPIProgressBar from '../atoms/KPIProgressBar';
import TrendIndicator from '../atoms/TrendIndicator';
import type { TrendVariant } from '../atoms/TrendIndicator';

interface KPIStatCardProps {
  icon: React.ReactNode;
  value: number | string;
  label: string;
  trend?: string;
  trendVariant?: TrendVariant;
  progress?: number;
  progressColor?: string;
  variant?: 'default' | 'critical' | 'success';
  onClick?: () => void;
}

export default function KPIStatCard({
  icon,
  value,
  label,
  trend,
  trendVariant = 'neutral',
  progress,
  progressColor,
  variant = 'default',
  onClick,
}: KPIStatCardProps) {
  const borderColor =
    variant === 'critical'
      ? 'border-l-red-500'
      : variant === 'success'
        ? 'border-l-emerald-500'
        : 'border-l-[#C4C6CD] dark:border-l-neutral-600';

  const cardClasses = `flex flex-col gap-3 p-5 rounded-xl border border-[#E8E2D5] dark:border-neutral-700 bg-white dark:bg-neutral-800 border-l-4 ${borderColor} shadow-sm ${
    onClick
      ? 'cursor-pointer transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006F66] dark:focus-visible:outline-[#FFB95F]'
      : ''
  }`;

  const content = (
    <>
      <div className="flex items-center justify-between">
        <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-[#F8F3E9] dark:bg-neutral-700">
          {icon}
        </div>
        {trend && <TrendIndicator text={trend} variant={trendVariant} />}
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-[28px] font-bold font-inter text-[#03192E] dark:text-white leading-8">
          {value}
        </span>
        <span className="text-[11px] font-bold font-hankenGrotesk tracking-[0.05em] text-[#74777D] dark:text-neutral-400 uppercase">
          {label}
        </span>
      </div>
      {progress !== undefined && (
        <KPIProgressBar
          value={progress}
          color={progressColor || 'bg-[#091426]'}
          bgColor="bg-[#F2EDE3] dark:bg-neutral-700"
        />
      )}
    </>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={`${cardClasses} w-full text-left`}>
        {content}
      </button>
    );
  }

  return <div className={cardClasses}>{content}</div>;
}
