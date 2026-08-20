"use client";

export type TrendVariant = 'positive' | 'negative' | 'neutral';

interface TrendIndicatorProps {
  text: string;
  variant: TrendVariant;
}

const colorMap: Record<TrendVariant, string> = {
  positive: 'text-emerald-600 dark:text-emerald-400',
  negative: 'text-red-600 dark:text-red-400',
  neutral: 'text-neutral-500 dark:text-neutral-400',
};

export default function TrendIndicator({ text, variant }: TrendIndicatorProps) {
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold leading-4 ${colorMap[variant]}`}>
      {variant === 'positive' && (
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M5 0L9.5 5H0.5L5 0Z" fill="currentColor" />
        </svg>
      )}
      {variant === 'negative' && (
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M5 10L0.5 5H9.5L5 10Z" fill="currentColor" />
        </svg>
      )}
      {text}
    </span>
  );
}
