"use client";

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useStoredUser } from '../../utils/user';
import { useI18n } from '../../providers/I18nProvider';
import { apiFetch } from '../../utils/apiClient';
import { localizedDesc, localizedRoomName } from '../../utils/room';
import { createStudyGroup } from '../../utils/studyGroup';
import styles from './RoomDetailPanel.module.css';

interface RoomDetails {
  roomId: number;
  branchId: number;
  roomName: string;
  tvNum: number;
  boardNum: number;
  socketNum: number;
  projectorNum: number;
  imgUrl: string | null;
  capacity: number;
  description: string;
}

interface AvailabilitySlot {
  availId: number;
  startTime: string;
  endTime: string;
  status: 'free' | 'reserved' | 'pending';
  reserveId: string | null;
}

interface RoomDetailPanelProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: number | null;
  branchId: number;
}

export default function RoomDetailPanel({ isOpen, onClose, roomId, branchId }: RoomDetailPanelProps) {
  const { t } = useI18n();
  const user = useStoredUser();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roomDetails, setRoomDetails] = useState<RoomDetails | null>(null);
  const todayStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD format in localtime zone
  const nowTimeStr = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }); // HH:mm:ss format
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return todayStr;
  });
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [imgSrc, setImgSrc] = useState<string>('');
  const [mode, setMode] = useState<'freely' | 'studyGroup' | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [groupTitle, setGroupTitle] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [groupSubject, setGroupSubject] = useState('');
  const [groupRequirements, setGroupRequirements] = useState(['']);
  const contentScrollRef = useRef<HTMLDivElement>(null);
  const [contentScrollbar, setContentScrollbar] = useState({ visible: false, thumbHeight: 0, thumbTop: 0 });

  const updateContentScrollbar = useCallback(() => {
    const element = contentScrollRef.current;
    if (!element) return;
    const viewportHeight = element.clientHeight;
    const contentHeight = element.scrollHeight;
    if (contentHeight <= viewportHeight + 1) {
      setContentScrollbar({ visible: false, thumbHeight: 0, thumbTop: 0 });
      return;
    }
    const trackHeight = Math.max(0, viewportHeight - 16);
    const thumbHeight = Math.max(42, (viewportHeight / contentHeight) * trackHeight);
    const scrollRange = contentHeight - viewportHeight;
    const thumbRange = Math.max(0, trackHeight - thumbHeight);
    setContentScrollbar({
      visible: true,
      thumbHeight,
      thumbTop: scrollRange > 0 ? (element.scrollTop / scrollRange) * thumbRange : 0,
    });
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const frame = requestAnimationFrame(updateContentScrollbar);
    const element = contentScrollRef.current;
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(updateContentScrollbar);
    if (element) {
      observer?.observe(element);
      if (element.firstElementChild) observer?.observe(element.firstElementChild);
    }
    window.addEventListener('resize', updateContentScrollbar);
    return () => {
      cancelAnimationFrame(frame);
      observer?.disconnect();
      window.removeEventListener('resize', updateContentScrollbar);
    };
  }, [availability, confirmed, error, isOpen, loading, mode, roomDetails, updateContentScrollbar]);

  // Lock body scroll when panel is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Fetch Room Details
  useEffect(() => {
    if (!isOpen || !roomId) {
      queueMicrotask(() => {
        setRoomDetails(null);
        setAvailability([]);
        setError(null);
        setMode(null);
        setSelectedSlot(null);
        setConfirmed(false);
        setConfirmError(null);
        setGroupTitle('');
        setGroupDescription('');
        setGroupSubject('');
        setGroupRequirements(['']);
      });
      return;
    }

    const fetchDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await apiFetch<RoomDetails>(`/api/rooms/details?roomId=${roomId}&branchId=${branchId}`);
        if (result.success && result.data) {
          setRoomDetails(result.data);
          setImgSrc(result.data.imgUrl || `/api/assets/3D/${result.data.roomId}`);
        } else {
          throw new Error('Room details currently unavailable');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch details');
        setRoomDetails(null);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [isOpen, roomId, branchId]);

  // Fetch Availability if capacity > 0 and logged in
  useEffect(() => {
    if (!isOpen || !roomDetails || roomDetails.capacity <= 0 || !user) {
      queueMicrotask(() => setAvailability([]));
      return;
    }

    const fetchAvailability = async () => {
      try {
        const result = await apiFetch<AvailabilitySlot[]>(
          `/api/rooms/availability?roomId=${roomDetails.roomId}&date=${selectedDate}`
        );
        if (result.success && result.data) {
          setAvailability(result.data);
        }
      } catch (err) {
        console.error('Availability fetch error:', err);
      }
    };

    fetchAvailability();
  }, [isOpen, roomDetails, selectedDate, user]);

  // Handle fallback when 3D image fails to load
  const handleImageError = () => {
    // Falls back to a default visual representation if missing
    setImgSrc('');
  };

  const formatTime = (timeStr: string) => {
    // 08:00:00 -> 08:00
    return timeStr.slice(0, 5);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'free':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'reserved':
        return 'bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-300';
      case 'pending':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
      default:
        return 'bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-300';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'free':
        return t('room.slot_available') || 'Available';
      case 'reserved':
        return t('room.slot_reserved') || 'Reserved';
      case 'pending':
        return t('room.slot_pending') || 'Pending';
      default:
        return status;
    }
  };

  const cleanRoomName = (name: string) => {
    if (!name) return '';
    return name.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim();
  };

  return (
    <>
      {/* Backdrop overlay */}
      <div
        onClick={onClose}
        className={`fixed top-[84px] inset-x-0 bottom-0 bg-black/40 backdrop-blur-xs transition-opacity duration-300 z-40 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Slide-out drawer panel */}
        <div
      className={`fixed top-[84px] right-0 h-[calc(100vh-84px)] w-full sm:w-[450px] bg-[#FFF8EB] dark:bg-neutral-900 border-l border-[#C5C6CD] dark:border-neutral-800 shadow-2xl transition-transform duration-300 ease-in-out z-40 flex flex-col overflow-hidden ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-800">
          <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">
            {roomDetails ? localizedRoomName(t, roomDetails.roomId, cleanRoomName(roomDetails.roomName)) : ''}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            aria-label="Close panel"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="relative flex min-h-0 flex-1 overflow-hidden">
        <div ref={contentScrollRef} onScroll={updateContentScrollbar} className={`${styles.roomDetailScroller} min-h-0 flex-1 overflow-y-auto p-5 pr-7 space-y-6`}>
          {loading && (
            <div className="flex flex-col items-center justify-center py-10 space-y-2">
              <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm text-neutral-500">Loading details...</p>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 text-sm">
              <p className="font-semibold">Error</p>
              <p className="mt-1">{error}</p>
            </div>
          )}

          {!loading && !error && roomDetails && (
            <div className="space-y-6">
              {/* 3D Visualization Visual */}
              <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center">
                {imgSrc ? (
                  <img
                    src={imgSrc}
                    alt={`${roomDetails.roomName} 3D visualization`}
                    className="w-full h-full object-cover transition-opacity duration-300"
                    onError={handleImageError}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center p-4 text-center text-neutral-400 dark:text-neutral-500 space-y-2">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="12 2 2 7 12 12 22 7 12 2" />
                      <polyline points="2 17 12 22 22 17" />
                      <polyline points="2 12 12 17 22 12" />
                    </svg>
                    <span className="text-xs font-medium uppercase tracking-wider">3D Preview Offline</span>
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                  {t('room.description_heading')}
                </h3>
                <p className="text-neutral-700 dark:text-neutral-300 text-sm leading-relaxed">
                  {localizedDesc(t, roomDetails.roomId, roomDetails.description) || 'No description available for this study space.'}
                </p>
              </div>

              {/* Room Stats (Conditional on Capacity > 0) */}
              {roomDetails.capacity > 0 ? (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                    {t('room.room_details')}
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {/* Capacity */}
                    <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800 flex flex-col justify-center">
                      <span className="text-xs text-neutral-500 dark:text-neutral-400">{t('floor_map.panel.capacity')}</span>
                      <span className="text-sm font-bold text-neutral-800 dark:text-neutral-200 mt-0.5">
                        {roomDetails.capacity} {t('floor_map.panel.people')}
                      </span>
                    </div>

                    {/* Sockets */}
                    <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800 flex flex-col justify-center">
                      <span className="text-xs text-neutral-500 dark:text-neutral-400">{t('floor_map.panel.sockets')}</span>
                      <span className="text-sm font-bold text-neutral-800 dark:text-neutral-200 mt-0.5">
                        {roomDetails.socketNum || t('floor_map.panel.none')}
                      </span>
                    </div>

                    {/* TV Screens */}
                    <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800 flex flex-col justify-center">
                      <span className="text-xs text-neutral-500 dark:text-neutral-400">{t('floor_map.panel.tv')}</span>
                      <span className="text-sm font-bold text-neutral-800 dark:text-neutral-200 mt-0.5">
                        {roomDetails.tvNum || t('floor_map.panel.none')}
                      </span>
                    </div>

                    {/* Whiteboard */}
                    <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800 flex flex-col justify-center">
                      <span className="text-xs text-neutral-500 dark:text-neutral-400">{t('floor_map.panel.whiteboard')}</span>
                      <span className="text-sm font-bold text-neutral-800 dark:text-neutral-200 mt-0.5">
                        {roomDetails.boardNum || t('floor_map.panel.none')}
                      </span>
                    </div>

                    {/* Projectors */}
                    <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800 flex flex-col justify-center">
                      <span className="text-xs text-neutral-500 dark:text-neutral-400">{t('floor_map.panel.projector')}</span>
                      <span className="text-sm font-bold text-neutral-800 dark:text-neutral-200 mt-0.5">
                        {roomDetails.projectorNum || t('floor_map.panel.none')}
                      </span>
                    </div>
                  </div>

                  {/* Booking / Availability Section */}
                  <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800 space-y-4">
                    {user ? (
                      <>
                        {!mode ? (
                          /* Mode Selection */
                          <div className="space-y-3">
                            <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                              {t('room.select_mode') || 'Select Mode'}
                            </h3>
                              <button
                              onClick={() => setMode('freely')}
                              className="w-full py-2.5 px-4 rounded-lg bg-[#FFB95F] text-[#091426] font-semibold text-sm hover:bg-[#e6a54d] active:scale-[0.98] transition-all border border-[#FFB95F] shadow-sm flex items-center justify-center gap-2"
                            >
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                <line x1="16" y1="2" x2="16" y2="6" />
                                <line x1="8" y1="2" x2="8" y2="6" />
                                <line x1="3" y1="10" x2="21" y2="10" />
                              </svg>
                              {t('room.freely_mode')}
                            </button>
                            <button
                              onClick={() => setMode('studyGroup')}
                              className="w-full py-2.5 px-4 rounded-lg bg-cyan-600 text-white dark:bg-cyan-500 dark:text-neutral-950 font-semibold text-sm hover:bg-cyan-700 dark:hover:bg-cyan-400 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                            >
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                              </svg>
                              {t('room.study_group_mode')}
                            </button>
                          </div>
                        ) : (
                          /* Shared slot selection with mode-specific confirmation */
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                                {t('floor_map.panel.available_slots')}
                              </h3>
                              <input
                                type="date"
                                value={selectedDate}
                                min={todayStr}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setSelectedSlot(null);
                                  if (val < todayStr) {
                                    setSelectedDate(todayStr);
                                  } else {
                                    setSelectedDate(val);
                                  }
                                }}
                                className="text-xs px-2 py-1 rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                              />
                            </div>

                            {confirmed ? (
                              /* Success confirmation */
                              <div className="p-4 text-center rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/30">
                                <svg className="w-8 h-8 text-green-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <p className="mt-2 text-sm font-medium text-green-700 dark:text-green-400">
                                  {t('room.reserve_success')}
                                </p>
                              </div>
                            ) : (
                              <>
                                {confirmError && (
                                  <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 text-xs">
                                    {confirmError}
                                  </div>
                                )}

                                {/* Availability list */}
                                  {availability.length > 0 ? (
                                  <div className="divide-y divide-neutral-100 dark:divide-neutral-800 border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden bg-neutral-50/50 dark:bg-neutral-800/30">
                                    {availability.map((slot) => {
                                      const isToday = selectedDate === todayStr;
                                      const isPast = isToday && slot.startTime < nowTimeStr;
                                      const isFree = slot.status === 'free' && !isPast;
                                      const isSelected = selectedSlot === slot.availId;
                                      return (
                                        <div
                                          key={slot.availId}
                                          onClick={() => isFree && setSelectedSlot(selectedSlot === slot.availId ? null : slot.availId)}
                                          className={`flex items-center justify-between p-3 ${
                                            isFree ? 'cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800' : ''
                                          } ${isSelected ? 'bg-cyan-50 dark:bg-cyan-950/20 ring-1 ring-cyan-400' : ''} ${
                                            isPast ? 'opacity-40' : ''
                                          }`}
                                        >
                                          <div className={`text-sm font-medium ${isPast ? 'text-neutral-400 dark:text-neutral-500' : 'text-neutral-700 dark:text-neutral-300'}`}>
                                            {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                                          </div>
                                          {isPast ? (
                                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-neutral-200 text-neutral-500 dark:bg-neutral-700 dark:text-neutral-400">
                                              Passed
                                            </span>
                                          ) : isSelected ? (
                                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300">
                                              {t('room.selected') || 'Selected'}
                                            </span>
                                          ) : (
                                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${getStatusColor(slot.status)}`}>
                                              {getStatusText(slot.status)}
                                            </span>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <p className="text-xs text-neutral-500 text-center py-4">{t('room.no_slots')}</p>
                                )}

                                {mode === 'studyGroup' && (
                                  <fieldset className="space-y-3 rounded-lg border border-neutral-200 p-3 dark:border-neutral-700">
                                    <legend className="px-1 text-sm font-semibold text-neutral-800 dark:text-neutral-200">{t('room.group_details')}</legend>
                                    <label className="block text-xs text-neutral-600 dark:text-neutral-300">
                                      {t('room.group_title')}
                                      <input required value={groupTitle} onChange={(event) => setGroupTitle(event.target.value)} maxLength={200} className="mt-1 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:ring-2 focus:ring-cyan-500 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100" />
                                    </label>
                                    <label className="block text-xs text-neutral-600 dark:text-neutral-300">
                                      {t('room.group_subject')}
                                      <input required value={groupSubject} onChange={(event) => setGroupSubject(event.target.value)} maxLength={30} className="mt-1 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:ring-2 focus:ring-cyan-500 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100" />
                                    </label>
                                    <label className="block text-xs text-neutral-600 dark:text-neutral-300">
                                      {t('room.group_description')}
                                      <textarea required value={groupDescription} onChange={(event) => setGroupDescription(event.target.value)} rows={3} className="mt-1 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:ring-2 focus:ring-cyan-500 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100" />
                                    </label>
                                    <div className="space-y-2">
                                      <span className="text-xs text-neutral-600 dark:text-neutral-300">{t('room.group_requirements')}</span>
                                      {groupRequirements.map((requirement, index) => (
                                        <div key={index} className="flex gap-2">
                                          <input aria-label={`${t('room.group_requirement')} ${index + 1}`} value={requirement} onChange={(event) => setGroupRequirements((items) => items.map((item, itemIndex) => itemIndex === index ? event.target.value : item))} className="min-w-0 flex-1 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:ring-2 focus:ring-cyan-500 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100" />
                                          {groupRequirements.length > 1 && <button type="button" onClick={() => setGroupRequirements((items) => items.filter((_, itemIndex) => itemIndex !== index))} className="rounded-md px-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30" aria-label={t('room.remove_requirement')}>×</button>}
                                        </div>
                                      ))}
                                      {groupRequirements.length < 5 && <button type="button" onClick={() => setGroupRequirements((items) => [...items, ''])} className="text-xs font-semibold text-cyan-700 dark:text-cyan-300 transition-colors hover:text-cyan-800 dark:hover:text-cyan-200">{t('room.add_requirement')}</button>}
                                    </div>
                                  </fieldset>
                                )}

                                {/* Confirm button */}
                                <button
                                  onClick={async () => {
                                    const isPast = selectedDate === todayStr &&
                                      availability.some(s => s.availId === selectedSlot && s.startTime < nowTimeStr);
                                    if (!selectedSlot || isConfirming || isPast) return;
                                    setIsConfirming(true);
                                    setConfirmError(null);
                                    try {
                                      const cleanedRequirements = groupRequirements.map((item) => item.trim()).filter(Boolean);
                                      if (mode === 'studyGroup' && (!groupTitle.trim() || !groupDescription.trim() || !groupSubject.trim() || !/\p{L}/u.test(groupTitle) || !/\p{L}/u.test(groupSubject))) {
                                        setConfirmError(t('room.group_validation_error'));
                                        return;
                                      }
                                      const result = mode === 'studyGroup'
                                        ? await createStudyGroup({ availId: selectedSlot, startDate: selectedDate, title: groupTitle, description: groupDescription, subject: groupSubject, requirements: cleanedRequirements })
                                        : await apiFetch('/api/rooms/reserve', {
                                            method: 'POST', headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ availId: selectedSlot, startDate: selectedDate }),
                                          });
                                      if (result.success) {
                                        setConfirmed(true);
                                      } else {
                                        setConfirmError(result.message || t('room.slot_unavailable'));
                                      }
                                    } catch {
                                      setConfirmError(t('room.slot_unavailable'));
                                    } finally {
                                      setIsConfirming(false);
                                    }
                                  }}
                                  disabled={!selectedSlot || isConfirming || (selectedDate === todayStr && availability.some(s => s.availId === selectedSlot && s.startTime < nowTimeStr))}
                                  className={`w-full py-2.5 px-4 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                                    !selectedSlot || isConfirming || (selectedDate === todayStr && availability.some(s => s.availId === selectedSlot && s.startTime < nowTimeStr))
                                      ? 'bg-neutral-300 dark:bg-neutral-700 text-neutral-500 cursor-not-allowed'
                                      : 'bg-[#FFB95F] text-[#091426] hover:bg-[#e6a54d] active:scale-[0.98]'
                                  }`}
                                >
                                  {isConfirming ? (
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                  ) : (
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                  )}
                                  {t('room.reserve_confirm')}
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="p-4 text-center rounded-lg bg-amber-50/50 dark:bg-amber-950/10 border border-amber-200/50 dark:border-amber-900/30">
                        <svg className="w-8 h-8 text-amber-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <p className="mt-2 text-sm font-medium text-neutral-800 dark:text-neutral-300">
                          {t('floor_map.panel.please_login')}
                        </p>
                        <Link href="/login" className="inline-block mt-3 text-xs font-semibold text-cyan-600 hover:text-cyan-500 dark:text-cyan-400 dark:hover:text-cyan-300">
                          Sign in to LIMA Account &rarr;
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>
        {contentScrollbar.visible && (
          <span className={styles.roomDetailScrollRail} aria-hidden="true">
            <span className={styles.roomDetailScrollThumb} style={{ height: `${contentScrollbar.thumbHeight}px`, transform: `translateY(${contentScrollbar.thumbTop}px)` }} />
          </span>
        )}
        </div>
      </div>
    </>
  );
}
