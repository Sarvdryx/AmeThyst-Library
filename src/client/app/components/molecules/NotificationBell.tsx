"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import BellIcon from '../atoms/BellIcon';
import NotificationDot from '../atoms/NotificationDot';
import NotificationDropdownPanel from './NotificationDropdownPanel';
import AnnouncementReadingModal from '../organisms/AnnouncementReadingModal';
import StudyGroupInvitationModal from '../organisms/StudyGroupInvitationModal';
import StudyGroupLifecycleModal from '../organisms/StudyGroupLifecycleModal';
import StudyGroupInvitationUnavailableModal from '../organisms/StudyGroupInvitationUnavailableModal';
import { displayDate } from '../../utils/notificationFormat';
import { useI18n } from '../../providers/I18nProvider';
import {
  isAnnouncementItem,
  isInvitationItem,
  isSystemItem,
  useAnnouncementBell,
  type BellAnnouncement,
  type NotificationItem,
} from '../../hooks/useAnnouncementBell';

interface NotificationBellProps {
  enabled: boolean;
  t: (key: string) => string;
  userId?: string;
}

export { displayDate };

export default function NotificationBell({ enabled, t, userId }: NotificationBellProps) {
  const { locale } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<BellAnnouncement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    items,
    loading,
    hasUnread,
    markAsSeen,
    invitationUnavailable,
    setInvitationUnavailable,
    selected,
    setSelected,
    selectedSystemNotification,
    setSelectedSystemNotification,
    acting,
    error,
    decide,
    markItemRead,
    isUserRole
  } = useAnnouncementBell(enabled, userId, t);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (selected || selectedSystemNotification || invitationUnavailable) {
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = previousOverflow;
      };
    }
  }, [invitationUnavailable, selected, selectedSystemNotification]);

  const handleToggle = () => {
    const next = !isOpen;
    setIsOpen(next);
    if (next) void markAsSeen();
  };

  const handleItemClick = (item: NotificationItem) => {
    setIsOpen(false);
    void markItemRead(item);
    if (isAnnouncementItem(item)) {
      setSelectedAnnouncement(item.metadata);
    } else if (isInvitationItem(item)) {
      setSelected(item.metadata);
    } else if (isSystemItem(item)) {
      setSelectedSystemNotification(item.metadata);
    }
  };

  const closeUnavailableInvitation = () => {
    setInvitationUnavailable(false);
    const url = new URL(window.location.href);
    url.searchParams.delete('invitation');
    window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
  };

  const visibleItems = useMemo(
    () => isUserRole ? items : items.filter(isAnnouncementItem),
    [isUserRole, items],
  );

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={handleToggle}
        className="relative text-white hover:text-[#8FB2C1] transition-colors flex items-center justify-center p-1 cursor-pointer focus:outline-none"
        aria-label={t('profile.notifications_aria')}
      >
        <BellIcon />
        <NotificationDot visible={hasUnread} />
      </button>

      {isOpen && (
        <NotificationDropdownPanel
          notifications={visibleItems}
          loading={loading}
          t={t}
          onClickItem={handleItemClick}
          formatDate={displayDate}
        />
      )}

      {selectedAnnouncement && (
        <AnnouncementReadingModal
          isOpen={true}
          onClose={() => setSelectedAnnouncement(null)}
          announcement={selectedAnnouncement}
          locale={locale}
          t={t}
        />
      )}

      {selected && (
        <StudyGroupInvitationModal
          selected={selected}
          onClose={() => setSelected(null)}
          t={t}
          acting={acting}
          error={error}
          decide={decide}
        />
      )}

      {selectedSystemNotification && (
        <StudyGroupLifecycleModal
          selectedSystemNotification={selectedSystemNotification}
          onClose={() => setSelectedSystemNotification(null)}
          t={t}
        />
      )}

      {invitationUnavailable && (
        <StudyGroupInvitationUnavailableModal
          onClose={closeUnavailableInvitation}
          t={t}
        />
      )}
    </div>
  );
}
