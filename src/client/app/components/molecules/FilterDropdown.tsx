"use client";

import { useState, useRef, useEffect } from 'react';

interface FilterDropdownProps {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export default function FilterDropdown({
  label,
  options,
  value,
  onChange,
  className = '',
}: FilterDropdownProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedLabel = value
    ? options.find((o) => o.value === value)?.label || label
    : label;

  const hasDefaultOption = options.some((o) => o.value === '');

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex pt-[13px] pr-10 pb-[13px] pl-6 items-center rounded-xl border border-[#E8E2D5] dark:border-neutral-600 bg-white dark:bg-neutral-800 text-[#1D1C16] dark:text-neutral-200 font-manrope text-base cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#091426] dark:focus:ring-white w-full whitespace-nowrap transition-colors hover:bg-[#F8F3E9] dark:hover:bg-neutral-700"
      >
        <span className="truncate">{selectedLabel}</span>
      </button>
      <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
        <svg width="12" height="24" viewBox="0 0 12 24" fill="none">
          <path d="M6 7.4L0 1.4L1.4 0L6 4.6L10.6 0L12 1.4L6 7.4Z" fill="#74777D" />
        </svg>
      </div>
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-[#E8E2D5] dark:border-neutral-600 bg-white dark:bg-neutral-800 shadow-lg overflow-hidden max-h-60 overflow-y-auto">
          {!hasDefaultOption && (
            <button
              onClick={() => { onChange(''); setOpen(false); }}
              className={`w-full text-left px-6 py-3 font-manrope text-base hover:bg-[#F8F3E9] dark:hover:bg-neutral-700 transition-colors ${
                value === '' ? 'bg-[#F8F3E9] dark:bg-neutral-700 font-bold text-[#03192E] dark:text-neutral-100' : 'text-[#1D1C16] dark:text-neutral-200'
              }`}
            >
              {label}
            </button>
          )}
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={`w-full text-left px-6 py-3 font-manrope text-base hover:bg-[#F8F3E9] dark:hover:bg-neutral-700 transition-colors ${
                value === opt.value ? 'bg-[#F8F3E9] dark:bg-neutral-700 font-bold text-[#03192E] dark:text-neutral-100' : 'text-[#1D1C16] dark:text-neutral-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
