"use client";

import React from 'react';

interface ErrorBannerProps {
  message: string;
  onDismiss: () => void;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({ message, onDismiss }) => {
  return (
    <div className="fixed top-0 left-0 w-full bg-red-500 text-white p-4 text-center z-[100] animate-in fade-in slide-in-from-top duration-300">
      <p className="font-semibold">{message}</p>
      <button
        type="button"
        onClick={onDismiss}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-200"
        aria-label="Dismiss error"
      >
        ✕
      </button>
    </div>
  );
};
