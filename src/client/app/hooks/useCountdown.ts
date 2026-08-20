import { useState, useEffect, useRef, useCallback } from 'react';

export function useCountdown(initialSeconds: number, onExpire?: () => void) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const [isExpired, setIsExpired] = useState(false);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setRunning(false);
  }, []);

  const start = useCallback(() => {
    stop();
    setRunning(true);
  }, [stop]);

  const reset = useCallback(() => {
    stop();
    setSecondsLeft(initialSeconds);
    setIsExpired(false);
  }, [initialSeconds, stop]);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          stop();
          setIsExpired(true);
          onExpireRef.current?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return stop;
  }, [running, stop]);

  useEffect(() => {
    return stop;
  }, [stop]);

  return { secondsLeft, isExpired, isActive: running, start, stop, reset };
}

export function useCountdownFromDate(expiresAt: string) {
  const calc = useCallback(() => {
    const now = Date.now();
    const exp = new Date(expiresAt).getTime();
    const diff = Math.max(0, Math.floor((exp - now) / 1000));
    return {
      minutes: Math.floor(diff / 60),
      seconds: diff % 60,
      isExpired: diff <= 0,
    };
  }, [expiresAt]);

  const [remaining, setRemaining] = useState(calc);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setRemaining(calc());
    intervalRef.current = setInterval(() => {
      setRemaining(calc());
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [calc]);

  return { ...remaining };
}
