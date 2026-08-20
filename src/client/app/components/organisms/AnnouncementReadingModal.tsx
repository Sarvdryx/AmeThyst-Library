"use client";

import React, { useEffect } from 'react';
import { ModalCloseButton } from '../atoms';
import type { BellAnnouncement } from '../../hooks/useAnnouncementBell';

interface AnnouncementReadingModalProps {
  isOpen: boolean;
  onClose: () => void;
  announcement: BellAnnouncement | null;
  locale: string;
  t: (key: string) => string;
}

export default function AnnouncementReadingModal({
  isOpen,
  onClose,
  announcement,
  locale,
  t,
}: AnnouncementReadingModalProps) {
  // Prevent background scrolling when open
  useEffect(() => {
    if (isOpen) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.paddingRight = `${scrollbarWidth}px`;
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.paddingRight = '';
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.paddingRight = '';
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle Escape key press
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !announcement) return null;

  const formattedCreated = announcement.createdAt
    ? new Date(announcement.createdAt).toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';

  const formattedExpired = announcement.expiredDate
    ? new Date(announcement.expiredDate).toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-background text-foreground rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl animate-scale-up border border-foreground/10 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Scrollable Container */}
        <div className="flex flex-col p-6 md:p-8 gap-6 overflow-y-auto custom-scrollbar min-w-0">
          {/* Header Section */}
          <div className="flex flex-col gap-3 w-full min-w-0">
            <div className="flex justify-between items-start gap-4 w-full min-w-0">
              <h2 className="min-w-0 text-[#091426] dark:text-neutral-200 font-inter text-2xl md:text-3xl font-extrabold leading-tight tracking-tight break-words [overflow-wrap:anywhere]">
                {announcement.title}
              </h2>
              <div className="shrink-0 pt-1">
                <ModalCloseButton onClick={onClose} />
              </div>
            </div>

            {/* Byline / Meta row */}
            <div className="text-foreground/50 font-inter text-xs md:text-sm font-medium flex flex-wrap gap-x-2 gap-y-1 items-center">
              <span>{t('navbar.announcement_published')}: {formattedCreated}</span>
              {formattedExpired && (
                <>
                  <span className="text-foreground/30">•</span>
                  <span>{t('navbar.announcement_expires')}: {formattedExpired}</span>
                </>
              )}
            </div>
          </div>

          <hr className="border-foreground/10" />

          {/* Body Content Section */}
          <div className="flex flex-col w-full max-w-2xl mx-auto min-w-0">
            <p className="text-foreground/80 font-inter text-base leading-relaxed whitespace-pre-line break-words [overflow-wrap:anywhere] select-text">
              {announcement.content}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}