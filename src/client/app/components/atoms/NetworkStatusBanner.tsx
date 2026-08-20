"use client";

import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../../providers/I18nProvider';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const PROBE_TIMEOUT_MS = 8000;
const PROBE_INTERVAL_MS = 15000;
const FAILURES_BEFORE_SHOW = 2;

export default function NetworkStatusBanner() {
  const { t } = useI18n();
  const [apiDown, setApiDown] = useState(false);

  // The banner is driven exclusively by a dedicated /health probe. Any HTTP
  // response — whatever the status — means the API answered, so the banner is
  // hidden. The banner only appears after consecutive probes fail to receive a
  // response, and a periodic probe guarantees it recovers on its own.
  useEffect(() => {
    const controllerRef: { current: AbortController | null } = { current: null };
    const failedRef: { current: number } = { current: 0 };

    const runProbe = () => {
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;
      const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
      fetch(`${API_URL}/health`, { signal: controller.signal })
        .then(() => {
          failedRef.current = 0;
          setApiDown(false);
        })
        .catch(() => {
          failedRef.current += 1;
          if (failedRef.current >= FAILURES_BEFORE_SHOW) setApiDown(true);
        })
        .finally(() => clearTimeout(timer));
    };

    const handleNetworkError = () => runProbe();
    const handleNetworkRecovered = () => {
      failedRef.current = 0;
      setApiDown(false);
    };

    window.addEventListener('network-error', handleNetworkError);
    window.addEventListener('network-recovered', handleNetworkRecovered);

    runProbe();
    const interval = setInterval(runProbe, PROBE_INTERVAL_MS);

    return () => {
      controllerRef.current?.abort();
      clearInterval(interval);
      window.removeEventListener('network-error', handleNetworkError);
      window.removeEventListener('network-recovered', handleNetworkRecovered);
    };
  }, []);

  if (!apiDown) return null;

  return (
    <div
      role="alert"
      className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-center gap-2 bg-red-600 px-4 py-2 text-white font-inter text-sm font-semibold shadow-md"
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M1 1l22 22M16.72 11.06A10.94 10.94 0 0 1 19 12.55M5 12.55a10.94 10.94 0 0 1 5.17-2.39M10.71 5.05A16 16 0 0 1 22.58 9M1.42 9a15.91 15.91 0 0 1 4.7-2.88M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span>{t('network.error')}</span>
    </div>
  );
}