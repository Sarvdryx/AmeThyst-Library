"use client";

interface AvailabilityBadgeProps {
  available: number;
  total: number;
}

export default function AvailabilityBadge({ available, total }: AvailabilityBadgeProps) {
  const isZero = available === 0;
  return (
    <span
      className={`inline-flex px-3 py-1 rounded-full font-hankenGrotesk text-xs font-bold leading-4 tracking-[0.05em] ${
        isZero
          ? 'bg-[#EDE8DE] dark:bg-neutral-700 text-[#43474D] dark:text-neutral-300'
          : 'bg-[rgba(94,234,212,0.15)] dark:bg-teal-900/30 text-[#009484] dark:text-teal-300'
      }`}
    >
      {available} / {total} available
    </span>
  );
}
