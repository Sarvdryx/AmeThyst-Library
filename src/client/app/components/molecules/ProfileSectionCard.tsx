"use client";

import React from 'react';

interface ProfileSectionCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function ProfileSectionCard({ title, children, className = '' }: ProfileSectionCardProps) {
  return (
    <section className="flex p-6 flex-col items-start gap-6 border border-[#E7E5E4] dark:border-neutral-700 shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] bg-white dark:bg-neutral-800 rounded-lg w-full transition-all">
      <div className="flex flex-col items-start w-full border-b border-slate-100 dark:border-neutral-700 pb-3">
        <h2 className="text-[#1E293B] dark:text-neutral-200 font-inter text-lg font-bold leading-7 w-full text-left">
          {title}
        </h2>
      </div>
      <div className={`w-full ${className}`}>
        {children}
      </div>
    </section>
  );
}
