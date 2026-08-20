"use client";

import { useRef, useState, useEffect, useCallback } from 'react';

interface OTPInputProps {
  value: string;
  onChange: (value: string) => void;
  onComplete: (value: string) => void;
  disabled?: boolean;
  error?: boolean;
  autoFocus?: boolean;
}

const SLOT_COUNT = 6;

export default function OTPInput({
  value,
  onChange,
  onComplete,
  disabled = false,
  error = false,
  autoFocus = true,
}: OTPInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>(Array(SLOT_COUNT).fill(null));
  const [activeIndex, setActiveIndex] = useState(-1);

  const focusSlot = useCallback((index: number) => {
    if (index >= 0 && index < SLOT_COUNT && !disabled) {
      inputRefs.current[index]?.focus();
      setActiveIndex(index);
    }
  }, [disabled]);

  useEffect(() => {
    if (autoFocus && !disabled) {
      focusSlot(0);
    }
  }, [autoFocus, disabled, focusSlot]);

  const getDigits = (): string[] => {
    const digits = value.split('');
    while (digits.length < SLOT_COUNT) digits.push('');
    return digits.slice(0, SLOT_COUNT);
  };

  const setDigitAt = (index: number, digit: string) => {
    const digits = getDigits();
    digits[index] = digit.slice(0, 1);
    const newValue = digits.join('');
    onChange(newValue);
    if (newValue.length === SLOT_COUNT) {
      onComplete(newValue);
    }
    if (digit && index < SLOT_COUNT - 1) {
      focusSlot(index + 1);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      const digits = getDigits();
      if (digits[index]) {
        setDigitAt(index, '');
      } else if (index > 0) {
        setDigitAt(index - 1, '');
        focusSlot(index - 1);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      focusSlot(index - 1);
    } else if (e.key === 'ArrowRight' && index < SLOT_COUNT - 1) {
      focusSlot(index + 1);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, SLOT_COUNT);
    if (pasted.length > 0) {
      onChange(pasted);
      if (pasted.length === SLOT_COUNT) {
        onComplete(pasted);
      }
      focusSlot(Math.min(pasted.length, SLOT_COUNT - 1));
    }
  };

  const digits = getDigits();

  return (
    <div className="flex gap-2 justify-center" role="group" aria-label="PIN input">
      {Array.from({ length: SLOT_COUNT }, (_, i) => (
        <input
          key={i}
          ref={(el) => { inputRefs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digits[i]}
          onChange={(e) => {
            const val = e.target.value.replace(/\D/g, '');
            setDigitAt(i, val);
          }}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={i === 0 ? handlePaste : undefined}
          onFocus={() => setActiveIndex(i)}
          onBlur={() => setActiveIndex(-1)}
          disabled={disabled}
          autoComplete="one-time-code"
          className={`w-12 h-14 text-center text-2xl font-mono rounded-lg border-2 outline-none transition-colors
            ${error
              ? 'border-red-500 dark:border-red-400 bg-red-50 dark:bg-red-900/20'
              : activeIndex === i
                ? 'border-amber-500 dark:border-amber-400 ring-1 ring-amber-500 dark:ring-amber-400 bg-white dark:bg-neutral-800'
                : 'border-[#E8E2D5] dark:border-neutral-700 bg-white dark:bg-neutral-800'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            text-neutral-900 dark:text-neutral-100
            [&::-webkit-inner-spin-button]:appearance-none
            [&::-webkit-outer-spin-button]:appearance-none
          `}
          aria-label={`Digit ${i + 1}`}
        />
      ))}
    </div>
  );
}
