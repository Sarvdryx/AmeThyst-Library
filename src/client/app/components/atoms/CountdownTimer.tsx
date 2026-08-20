"use client";

import { useState, useEffect } from 'react';

interface CountdownTimerProps {
  expiresAt: string;
  onExpire?: () => void;
  variant?: 'default' | 'urgent';
}

export default function CountdownTimer({ expiresAt, onExpire, variant = 'default' }: CountdownTimerProps) {
  const [remaining, setRemaining] = useState<number>(0);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    function tick() {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) {
        setRemaining(0);
        setExpired(true);
        onExpire?.();
        return;
      }
      setRemaining(diff);
    }

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [expiresAt, onExpire]);

  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  const display = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const isUrgent = variant === 'urgent' || (!expired && remaining < 3600000);

  return (
    <span
      className={`font-manrope text-sm font-bold tabular-nums ${
        expired
          ? 'text-red-600 dark:text-red-400'
          : isUrgent
            ? 'text-red-600 dark:text-red-400'
            : 'text-[#1D1C16] dark:text-neutral-200'
      }`}
    >
      {expired ? '00:00' : display}
    </span>
  );
}
