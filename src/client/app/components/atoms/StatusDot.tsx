"use client";

interface StatusDotProps {
  active: boolean;
}

export default function StatusDot({ active }: StatusDotProps) {
  return (
    <span
      className={`shrink-0 rounded-full w-2 h-2 ${
        active ? 'bg-[#5EEAD4]' : 'bg-[#74777D]'
      }`}
    />
  );
}
