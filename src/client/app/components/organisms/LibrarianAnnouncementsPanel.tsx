"use client";

import React from 'react';
import { useI18n } from '../../providers/I18nProvider';
import { Toast } from '../atoms';
import { AnnouncementManagementList, AnnouncementForm } from '../molecules';
import { useAnnouncementManager } from '../../hooks/useAnnouncementManager';

export default function LibrarianAnnouncementsPanel() {
  const { t } = useI18n();
  const {
    announcements,
    loading,
    saving,
    selectedId,
    selectedAnnouncement,
    toast,
    editTitle,
    editExpiryDate,
    editContent,
    setEditTitle,
    setEditExpiryDate,
    setEditContent,
    handleSelectAnnouncement,
    handleSave,
    handleDelete,
    getStatusBadgeStyles,
    getStatusTranslation,
    dismissToast,
  } = useAnnouncementManager(t);

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full mt-4">
      <AnnouncementManagementList
        announcements={announcements}
        loading={loading}
        selectedId={selectedId}
        saving={saving}
        onSelect={handleSelectAnnouncement}
        onCreateNew={() => handleSelectAnnouncement('new')}
        getStatusBadgeStyles={getStatusBadgeStyles}
        getStatusTranslation={getStatusTranslation}
      />
      <AnnouncementForm
        selectedId={selectedId}
        isNew={selectedId === 'new'}
        status={selectedAnnouncement?.status}
        saving={saving}
        editTitle={editTitle}
        editExpiryDate={editExpiryDate}
        editContent={editContent}
        onTitleChange={setEditTitle}
        onExpiryDateChange={setEditExpiryDate}
        onContentChange={setEditContent}
        onSave={handleSave}
        onDelete={handleDelete}
      />
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDismiss={dismissToast}
        />
      )}
    </div>
  );
}