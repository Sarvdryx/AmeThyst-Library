"use client";

import React, { useState } from 'react';
import NavBar from '../components/organisms/NavBar';
import Footer from '../components/organisms/Footer';
import FloorMap from '../components/organisms/FloorMap';
import RoomDetailPanel from '../components/organisms/RoomDetailPanel';
import { useI18n } from '../providers/I18nProvider';

export default function MapPage() {
  const { t } = useI18n();
  const [activeMap, setActiveMap] = useState<'Map1' | 'Map2'>('Map1');
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const handleRoomClick = (roomId: number) => {
    setSelectedRoomId(roomId);
    setIsPanelOpen(true);
  };

  const handleClosePanel = () => {
    setIsPanelOpen(false);
    setSelectedRoomId(null);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground transition-colors duration-300">
      <NavBar />

      <main className="flex-grow max-w-7xl mx-auto w-full px-4 py-8 flex flex-col items-center">
        <div className="text-center max-w-3xl mb-8 space-y-3">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-manrope">
            {t('floor_map.title') || 'Interactive Library Floor Map'}
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm sm:text-base leading-relaxed">
            {t('floor_map.description') || 'Explore available group study rooms, individual desks, PC areas, and library lockers. Hover to highlight and click to view live details and scheduling.'}
          </p>
        </div>

        {/* Branch Select Tab Buttons */}
        <div className="mb-8 flex flex-col items-center space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
            {t('floor_map.select_branch') || 'Select Library Branch'}
          </label>
          <div className="inline-flex rounded-lg p-1 bg-neutral-200/60 dark:bg-neutral-800/80 border border-neutral-300/30 shadow-inner">
            <button
              onClick={() => {
                setActiveMap('Map1');
                handleClosePanel();
              }}
              className={`px-4 py-2 text-xs font-bold rounded-md transition-all duration-200 ${
                activeMap === 'Map1'
                  ? 'bg-white dark:bg-neutral-900 text-cyan-600 dark:text-cyan-400 shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-850 dark:hover:text-neutral-200'
              }`}
            >
              {t('floor_map.branch_nvc') || 'Nguyen Van Cu (Branch 1)'}
            </button>
            <button
              onClick={() => {
                setActiveMap('Map2');
                handleClosePanel();
              }}
              className={`px-4 py-2 text-xs font-bold rounded-md transition-all duration-200 ${
                activeMap === 'Map2'
                  ? 'bg-white dark:bg-neutral-900 text-cyan-600 dark:text-cyan-400 shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-850 dark:hover:text-neutral-200'
              }`}
            >
              {t('floor_map.branch_lt') || 'Linh Trung (Branch 2)'}
            </button>
          </div>
        </div>

        {/* Map Viewer */}
        <div className="w-full max-w-5xl">
          <FloorMap
            activeMap={activeMap}
            onRoomClick={handleRoomClick}
            selectedRoomId={selectedRoomId}
          />
        </div>
      </main>

      <Footer />

      {/* Room details slide-out panel drawer */}
      <RoomDetailPanel
        isOpen={isPanelOpen}
        onClose={handleClosePanel}
        roomId={selectedRoomId}
        branchId={activeMap === 'Map1' ? 1 : 2}
      />
    </div>
  );
}
