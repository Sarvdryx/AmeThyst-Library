"use client";
import React, { useState, useEffect } from 'react';
import { Button } from '../atoms/Button';
import { useI18n } from '../../providers/I18nProvider';
import { StudyGroup } from '../../study-together/mockData';

interface RequestToJoinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (message: string) => void;
  group: StudyGroup | null;
}
export default function RequestToJoinModal({ isOpen, onClose, onSend, group }: RequestToJoinModalProps) {
  const { t } = useI18n();
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !group) return null;

  const handleSend = () => {
    onSend(message);
    setMessage('');
  };

  const handleClose = () => {
    setMessage('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-scale-up border border-[#EAEAEA] dark:border-neutral-800">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#EAEAEA] dark:border-neutral-800 flex items-center justify-between">
          <h3 className="font-manrope text-xl font-bold text-[#0B1C30] dark:text-white">
            {t('study_together.request_to_join')}
          </h3>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-6 pt-6 pb-3 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {group.title}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {group.subject} • {group.leader.name}
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            <textarea
              className="w-full h-40 p-4 text-sm rounded-xl border border-[#C5C6CD] bg-[#F8F9FF] focus:outline-none focus:ring-1 focus:ring-[#006A61] transition-all dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:focus:ring-[#FFB95F] resize-none shadow-inner"
              placeholder={t('study_together.message_placeholder')}
              maxLength={100}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <div className="text-right text-xs font-medium text-gray-500 dark:text-gray-400">
              {message.length} / 100
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-5 border-t border-[#EAEAEA] dark:border-neutral-800 flex flex-col gap-3 bg-gray-50 dark:bg-neutral-900/50">
          {group.retryAt && new Date(group.retryAt).getTime() > Date.now() && (
            <div className="text-sm text-red-600 dark:text-red-400 text-right font-medium">
              {t('study_group.cooldown_active')}: {new Date(group.retryAt).toLocaleTimeString()}
            </div>
          )}
          <div className="flex justify-end gap-3">
            <Button variant="outline" className="px-6 py-2.5 rounded-xl text-sm" onClick={handleClose}>
              {t('study_together.cancel')}
            </Button>
            <Button variant="primary" className="px-8 py-2.5 rounded-xl text-sm shadow-md" onClick={handleSend} disabled={message.trim().length === 0 || (group.retryAt !== null && new Date(group.retryAt).getTime() > Date.now())}>
              {t('study_together.send')}
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}
