"use client";
import React, { useState, useRef, useEffect } from 'react';

interface Option {
  value: string;
  label: string;
}

interface CustomSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function CustomSelect({ options, value, onChange, className = '' }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [activeIndex, setActiveIndex] = useState(-1);

  const selectedOption = options.find((opt) => opt.value === value) || options[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectOption = (option: Option) => {
    onChange(option.value);
    setIsOpen(false);
    setActiveIndex(-1);
    triggerRef.current?.focus();
  };

  const handleTriggerKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex(options.findIndex((opt) => opt.value === value));
    } else if (event.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleOptionKeyDown = (event: React.KeyboardEvent, index: number) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const next = event.key === 'ArrowDown'
        ? (index + 1) % options.length
        : (index - 1 + options.length) % options.length;
      setActiveIndex(next);
      const items = containerRef.current?.querySelectorAll<HTMLButtonElement>('[role="option"]');
      items?.[next]?.focus();
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      selectOption(options[index]);
    } else if (event.key === 'Escape') {
      setIsOpen(false);
      triggerRef.current?.focus();
    } else if (event.key === 'Tab') {
      setIsOpen(false);
    }
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleTriggerKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls="custom-select-options"
        className="w-full h-10 px-4 rounded-lg border border-[#C5C6CD] bg-white text-sm focus:outline-none focus:ring-1 focus:ring-[#006A61] transition-all hover:border-[#006A61] dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-200 dark:focus:ring-[#FFB95F] dark:hover:border-[#FFB95F] shadow-sm flex items-center justify-between gap-2"
      >
        <span className="truncate">{selectedOption?.label}</span>
        <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div
          id="custom-select-options"
          role="listbox"
          aria-label="Select option"
          className="absolute z-50 w-full mt-2 bg-white dark:bg-neutral-800 border border-[#EAEAEA] dark:border-neutral-700 rounded-xl shadow-lg animate-fade-in py-2"
        >
          <div className="max-h-56 overflow-y-auto custom-scrollbar px-2 flex flex-col gap-1">
            {options.map((option, index) => (
              <button
                key={option.value}
                role="option"
                aria-selected={value === option.value}
                ref={index === activeIndex ? (el) => { if (el) el.focus(); } : undefined}
                onClick={() => selectOption(option)}
                onKeyDown={(event) => handleOptionKeyDown(event, index)}
                className={`w-full text-left px-3 py-2.5 text-sm rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-neutral-700 focus:outline-none focus:ring-1 focus:ring-[#006A61] dark:focus:ring-[#FFB95F] ${
                  value === option.value 
                    ? 'bg-gray-50 dark:bg-neutral-700/50 text-[#006A61] dark:text-[#FFB95F] font-semibold' 
                    : 'text-gray-700 dark:text-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
