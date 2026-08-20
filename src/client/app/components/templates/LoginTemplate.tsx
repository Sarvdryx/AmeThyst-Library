"use client";

import React from 'react';
import { NavBar, Footer } from '../organisms';
import { ErrorBanner } from '../molecules/ErrorBanner';

interface LoginTemplateProps {
  leftPanel: React.ReactNode;
  formContent: React.ReactNode;
  error?: string | null;
  onErrorDismiss?: () => void;
}

export default function LoginTemplate({ 
  leftPanel, 
  formContent,
  error = null,
  onErrorDismiss
}: LoginTemplateProps) {
  return (
    <main className="min-h-screen bg-[#FFF8EB] dark:bg-[#091426] flex flex-col font-inter text-[#091426] dark:text-neutral-200 overflow-x-hidden relative">
      <NavBar />
      
      {error && (
        <ErrorBanner
          message={error}
          onDismiss={onErrorDismiss || (() => {})}
        />
      )}

      <div className="flex flex-col lg:flex-row flex-grow">
        {leftPanel}

        {/* Right Panel (Form Area) */}
        <section className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 min-h-screen">
          {formContent}
        </section>
      </div>
      <Footer />
    </main>
  );
}