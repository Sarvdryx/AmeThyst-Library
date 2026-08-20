"use client";

import { useState, useEffect } from 'react';
import { apiFetch } from '../utils/apiClient';
import { type Announcement, type AnnouncementStatus } from '../components/molecules/AnnouncementListItem';

const mapBackendToFrontend = (ann: any): Announcement => ({
  id: ann.announceId,
  title: ann.title || '',
  status: (ann.status ? ann.status.toUpperCase() : 'DRAFT') as AnnouncementStatus,
  date: ann.createdAt 
    ? new Date(ann.createdAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
    : '',
  expiryDate: ann.expiredDate ? String(ann.expiredDate).split('T')[0] : '',
  content: ann.content || ''
});

export function useAnnouncementManager(
  t: (key: string, params?: Record<string, string | number>) => string
) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  // Editor state
  const [editTitle, setEditTitle] = useState('');
  const [editExpiryDate, setEditExpiryDate] = useState('');
  const [editContent, setEditContent] = useState('');

  // The announcement currently open in the editor (undefined when creating a new one)
  const selectedAnnouncement = selectedId && selectedId !== 'new'
    ? announcements.find(a => a.id === selectedId)
    : undefined;

  const hasUnsavedChanges = () => {
    if (selectedId === 'new') {
      return !!(editTitle || editExpiryDate || editContent);
    }
    if (selectedId) {
      const selected = announcements.find(a => a.id === selectedId);
      if (selected) {
        return (
          editTitle !== selected.title ||
          editExpiryDate !== selected.expiryDate ||
          editContent !== selected.content
        );
      }
    }
    return false;
  };

  const handleSelectAnnouncement = (id: string | null) => {
    if (id === selectedId) return;
    if (hasUnsavedChanges()) {
      if (!confirm(t('announcements.unsaved_changes_warning'))) {
        return;
      }
    }
    setSelectedId(id);
  };

  const fetchAnnouncements = async () => {
    setLoading(true);
    const res = await apiFetch<{ announcements: any[] }>('/dashboard/librarian/announcements?limit=100');
    if (res.success && res.data) {
      const mapped = res.data.announcements.map(mapBackendToFrontend);
      setAnnouncements(mapped);
      if (mapped.length > 0) {
        setSelectedId(mapped[0].id);
      } else {
        setSelectedId(null);
      }
    } else {
      setToast({ message: res.message || 'Failed to fetch announcements.', type: 'error' });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  useEffect(() => {
    if (selectedId && selectedId !== 'new') {
      const selected = announcements.find(a => a.id === selectedId);
      if (selected) {
        setEditTitle(selected.title);
        setEditExpiryDate(selected.expiryDate);
        setEditContent(selected.content);
      }
    } else if (selectedId === 'new') {
      setEditTitle('');
      setEditExpiryDate('');
      setEditContent('');
    } else {
      setEditTitle('');
      setEditExpiryDate('');
      setEditContent('');
    }
  }, [selectedId, announcements]);

  /**
   * Saves the current editor content, optionally transitioning the announcement
   * to `targetStatus`. If `targetStatus` is omitted (or equals the current status),
   * only the details (title/content/expiry) are persisted and the status is
   * left untouched — this is the "Save Changes" path used for already-published
   * or expired announcements.
   */
  const handleSave = async (targetStatus?: AnnouncementStatus) => {
    if (!selectedId) return;

    const isNew = selectedId === 'new';
    // For a brand-new announcement we need a concrete status to send to the API.
    const status: AnnouncementStatus = targetStatus ?? (selectedAnnouncement?.status || 'DRAFT');

    // Client-side validations
    if (!editTitle.trim()) {
      setToast({ message: t('announcements.validation_title_required'), type: 'error' });
      return;
    }
    if (!editContent.trim()) {
      setToast({ message: t('announcements.validation_content_required'), type: 'error' });
      return;
    }

    if (editExpiryDate) {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const date = String(today.getDate()).padStart(2, '0');
      const todayStr = `${year}-${month}-${date}`;

      if (editExpiryDate < todayStr) {
        setToast({ message: t('announcements.validation_expiry_past'), type: 'error' });
        return;
      }
    }

    // Unpublishing (ACTIVE -> DRAFT) removes the announcement from the public
    // page, so require an explicit confirmation instead of letting it happen
    // as a side effect of an unrelated content edit.
    if (!isNew && selectedAnnouncement?.status === 'ACTIVE' && status === 'DRAFT') {
      if (!confirm(t('announcements.confirm_unpublish'))) {
        return;
      }
    }

    setSaving(true);
    try {
      if (isNew) {
        const res = await apiFetch<any>('/dashboard/librarian/announcements', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: editTitle,
            content: editContent,
            expired_date: editExpiryDate || null,
            status: status.toLowerCase()
          })
        });
        if (res.success && res.data) {
          const saved = mapBackendToFrontend(res.data);
          setAnnouncements(prev => [saved, ...prev]);
          setSelectedId(saved.id);
          setToast({ message: 'Announcement created successfully!', type: 'success' });
        } else {
          setToast({ message: res.message || 'Failed to create announcement.', type: 'error' });
        }
      } else {
        const current = announcements.find(a => a.id === selectedId);
        if (!current) return;

        // Update details
        const detailsRes = await apiFetch<any>(`/dashboard/librarian/announcements/${selectedId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: editTitle,
            content: editContent,
            expired_date: editExpiryDate || null
          })
        });

        if (!detailsRes.success) {
          setToast({ message: detailsRes.message || 'Failed to update announcement details.', type: 'error' });
          return;
        }

        let updatedData = detailsRes.data;

        // Update local state with the successfully saved details immediately
        const detailsUpdated = mapBackendToFrontend(updatedData);
        setAnnouncements(prev => prev.map(a => a.id === selectedId ? detailsUpdated : a));

        // Only hit the status endpoint when the caller actually asked for a
        // status transition (targetStatus provided and different from current).
        if (targetStatus && current.status !== targetStatus) {
          const statusRes = await apiFetch<any>(`/dashboard/librarian/announcements/${selectedId}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              status: targetStatus.toLowerCase()
            })
          });

          if (!statusRes.success) {
            setToast({ message: statusRes.message || 'Failed to update announcement status.', type: 'error' });
            return;
          }
          updatedData = statusRes.data;

          // Update local state again with the new status
          const finalUpdated = mapBackendToFrontend(updatedData);
          setAnnouncements(prev => prev.map(a => a.id === selectedId ? finalUpdated : a));
        }

        setToast({ message: 'Announcement updated successfully!', type: 'success' });
      }
    } catch (err) {
      setToast({ message: 'An unexpected error occurred.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedId || selectedId === 'new') return;
    
    if (confirm('Are you sure you want to delete this announcement?')) {
      setSaving(true);
      try {
        const res = await apiFetch<any>(`/dashboard/librarian/announcements/${selectedId}`, {
          method: 'DELETE'
        });
        if (res.success) {
          setAnnouncements(prev => prev.filter(a => a.id !== selectedId));
          setSelectedId(null);
          setToast({ message: 'Announcement deleted successfully!', type: 'success' });
        } else {
          setToast({ message: res.message || 'Failed to delete announcement.', type: 'error' });
        }
      } catch (err) {
        setToast({ message: 'An unexpected error occurred.', type: 'error' });
      } finally {
        setSaving(false);
      }
    }
  };

  const getStatusBadgeStyles = (status: AnnouncementStatus) => {
    switch(status) {
      case 'ACTIVE': return 'bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-300';
      case 'DRAFT': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300';
      case 'EXPIRED': return 'bg-gray-200 text-gray-700 dark:bg-gray-700/50 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const getStatusTranslation = (status: AnnouncementStatus) => {
    switch(status) {
      case 'ACTIVE': return t('announcements.status_active');
      case 'DRAFT': return t('announcements.status_draft');
      case 'EXPIRED': return t('announcements.status_expired');
      default: return status;
    }
  };

  const dismissToast = () => setToast(null);

  return {
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
  };
}
