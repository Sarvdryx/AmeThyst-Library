"use client";

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { StudyGroup } from '../../../study-together/mockData';
import StudyGroupCard from '../../../components/molecules/StudyGroupCard';
import StudyGroupInvitationCard from '../../../components/molecules/StudyGroupInvitationCard';
import StudyGroupInfoModal from '../../../components/organisms/StudyGroupInfoModal';
import { I18nProvider, useI18n } from '../../../providers/I18nProvider';
import { acceptStudyGroupInvitation, denyStudyGroupInvitation, getStudyGroup, listCreatedStudyGroups, listJoinedStudyGroups, listStudyGroupInvitations, toLegacyStudyGroup } from '../../../utils/studyGroup';
import { getAuthToken } from '../../../utils/user';
import { useSocket } from '../../../utils/useSocket';
import type { StudyGroupInvitation } from '../../../types/studyGroup';

type CreatedStatusFilter = 'inprogress' | 'full' | 'upcoming' | 'completed' | 'expired';
type JoinedStatusFilter = 'approved' | 'pending' | 'denied' | 'expired';
type DashboardGroupMode = 'created' | 'joined';
type DashboardTab = DashboardGroupMode | 'invitations';

interface YourStudyGroupsContentProps {
  initialGroupId?: string | null;
  initialMode?: DashboardGroupMode | null;
}

const dashboardGroupFromPath = () => {
  const match = window.location.pathname.match(/^\/dashboard\/user\/yourstudygroups\/(created|joined)\/([^/]+)\/?$/);
  if (!match) return null;
  try {
    return { mode: match[1] as DashboardGroupMode, groupId: decodeURIComponent(match[2]) };
  } catch {
    return { mode: match[1] as DashboardGroupMode, groupId: match[2] };
  }
};

function YourStudyGroupsContent({ initialGroupId = null, initialMode = null }: YourStudyGroupsContentProps) {
  const { t } = useI18n();
  const router = useRouter();
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(initialGroupId);
  const [routedGroup, setRoutedGroup] = useState<StudyGroup | null>(null);
  const [modalMode, setModalMode] = useState<DashboardGroupMode>(initialMode || 'created');
  const [activeTab, setActiveTab] = useState<DashboardTab>(initialMode || 'created');
  const [routeGroupLoading, setRouteGroupLoading] = useState(Boolean(initialGroupId));
  const [routeGroupError, setRouteGroupError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [createdGroups, setCreatedGroups] = useState<StudyGroup[]>([]);
  const [joinedGroups, setJoinedGroups] = useState<StudyGroup[]>([]);
  const [invitations, setInvitations] = useState<StudyGroupInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [createdStatuses, setCreatedStatuses] = useState<CreatedStatusFilter[]>([]);
  const [joinedStatuses, setJoinedStatuses] = useState<JoinedStatusFilter[]>([]);
  const [actingInvitationId, setActingInvitationId] = useState<string | null>(null);
  const [invitationError, setInvitationError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const itemsPerPage = 8;
  const invitationsPerPage = 6;

  const loadGroups = useCallback(async (silent = false) => {
    if (!silent) { setLoading(true); setLoadError(null); }
    const [created, joined, pendingInvitations] = await Promise.all([
      listCreatedStudyGroups({ page: 1, pageSize: 50 }),
      listJoinedStudyGroups({ page: 1, pageSize: 50 }),
      listStudyGroupInvitations(),
    ]);
    if (created.success && created.data) setCreatedGroups(created.data.filter((group) => group.status !== 'cancelled').map((group) => toLegacyStudyGroup(group, undefined, t)));
    else { setCreatedGroups([]); setLoadError(created.message || 'Unable to load Study Groups.'); }
    if (joined.success && joined.data) {
      const visibleJoined = joined.data.filter((item) => item.group.status !== 'cancelled');
      const uniqueJoined = [...new Map(visibleJoined.map((item) => [item.group.groupId, item])).values()];
      setJoinedGroups(uniqueJoined.map((item) => toLegacyStudyGroup(item.group, item.participation.status, t)));
    }
    else { setJoinedGroups([]); setLoadError((error) => error || joined.message || 'Unable to load Study Groups.'); }
    if (pendingInvitations.success && pendingInvitations.data) {
      setInvitations(pendingInvitations.data);
      setInvitationError(null);
    } else {
      setInvitations([]);
      setInvitationError(pendingInvitations.message || t('study_group.invitation_action_error'));
    }
    if (!silent) setLoading(false);
  }, [t]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadGroups();
    const timer = window.setInterval(() => void loadGroups(true), 30_000);
    const refreshVisible = () => { if (document.visibilityState === 'visible') void loadGroups(true); };
    document.addEventListener('visibilitychange', refreshVisible);
    return () => { window.clearInterval(timer); document.removeEventListener('visibilitychange', refreshVisible); };
  }, [loadGroups]);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('joined') !== '1') return;
    const showJoined = window.setTimeout(() => { setActiveTab('joined'); setNotice(t('study_group.joined_from_invitation')); }, 0);
    const timer = window.setTimeout(() => setNotice(null), 5000);
    return () => { window.clearTimeout(showJoined); window.clearTimeout(timer); };
  }, [t]);

  const socket = useSocket(getAuthToken());
  useEffect(() => {
    if (!socket) return;
    const refresh = () => void loadGroups(true);
    socket.on('study-group:changed', refresh);
    return () => { socket.off('study-group:changed', refresh); };
  }, [loadGroups, socket]);

  const handleCardClick = (id: string, mode: DashboardGroupMode) => {
    window.history.pushState({ dashboardStudyGroupModal: true }, '', `/dashboard/user/yourstudygroups/${mode}/${encodeURIComponent(id)}`);
    setRouteGroupError(null);
    setSelectedGroupId(id);
    setModalMode(mode);
  };

  const handleTabChange = (tab: DashboardTab) => {
    setActiveTab(tab);
    setCurrentPage(1);
    setInvitationError(null);
  };

  const handleInvitationDecision = async (invitation: StudyGroupInvitation, decision: 'accept' | 'deny') => {
    if (actingInvitationId) return;
    setActingInvitationId(invitation.requestId);
    setInvitationError(null);
    const result = decision === 'accept'
      ? await acceptStudyGroupInvitation(invitation.group.groupId, invitation.requestId)
      : await denyStudyGroupInvitation(invitation.group.groupId, invitation.requestId);
    if (!result.success) {
      setInvitationError(result.message || t('study_group.invitation_action_error'));
      setActingInvitationId(null);
      return;
    }
    setInvitations((current) => current.filter((item) => item.requestId !== invitation.requestId));
    await loadGroups(true);
    setActingInvitationId(null);
    if (decision === 'accept') {
      setActiveTab('joined');
      setCurrentPage(1);
      setNotice(t('study_group.joined_from_invitation'));
      handleCardClick(invitation.group.groupId, 'joined');
    } else {
      const remainingPages = Math.max(1, Math.ceil(Math.max(0, invitations.length - 1) / invitationsPerPage));
      setCurrentPage((page) => Math.min(page, remainingPages));
      setNotice(t('study_group.invitation_declined_self'));
    }
    window.setTimeout(() => setNotice(null), 5000);
  };

  useEffect(() => {
    const syncRoute = () => {
      const route = dashboardGroupFromPath();
      setSelectedGroupId(route?.groupId || null);
      if (route) {
        setModalMode(route.mode);
        setActiveTab(route.mode);
      } else {
        setRoutedGroup(null);
        setRouteGroupError(null);
        setRouteGroupLoading(false);
      }
    };
    window.addEventListener('popstate', syncRoute);
    return () => window.removeEventListener('popstate', syncRoute);
  }, []);

  const selectedGroup = useMemo(() => {
    if (!selectedGroupId) return null;
    const source = modalMode === 'created' ? createdGroups : joinedGroups;
    return source.find((group) => group.id === selectedGroupId)
      || (routedGroup?.id === selectedGroupId ? routedGroup : null);
  }, [createdGroups, joinedGroups, modalMode, routedGroup, selectedGroupId]);

  useEffect(() => {
    if (!selectedGroupId || selectedGroup) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRouteGroupLoading(false);
      setRouteGroupError(null);
      return;
    }
    let active = true;
    setRouteGroupLoading(true);
    setRouteGroupError(null);
    void getStudyGroup(selectedGroupId).then((result) => {
      if (!active) return;
      const detail = result.data;
      const allowed = detail && (modalMode === 'created'
        ? detail.isHost
        : !detail.isHost && Boolean(detail.currentUserParticipation));
      if (result.success && detail && allowed) {
        setRoutedGroup(toLegacyStudyGroup(detail, detail.currentUserParticipation?.status, t));
      } else {
        setRoutedGroup(null);
        const unavailable = result.error?.code === 'NOT_FOUND' || result.error?.code === 'VALIDATION_ERROR' || !allowed;
        setRouteGroupError(t(unavailable ? 'study_group.route_not_found' : 'study_group.route_load_error'));
      }
      setRouteGroupLoading(false);
    });
    return () => { active = false; };
  }, [modalMode, selectedGroup, selectedGroupId, t]);

  const closeGroupDetails = () => {
    setSelectedGroupId(null);
    setRoutedGroup(null);
    setRouteGroupError(null);
    if (window.history.state?.dashboardStudyGroupModal) {
      window.history.back();
      return;
    }
    router.replace('/dashboard/user/yourstudygroups', { scroll: false });
  };

  const createdStatusOptions: { value: 'all' | CreatedStatusFilter; label: string }[] = [
    { value: 'all', label: t('study_group.status_all') },
    { value: 'inprogress', label: t('study_group.status_inprogress') },
    { value: 'full', label: t('study_group.status_full') },
    { value: 'upcoming', label: t('study_group.status_upcoming') },
    { value: 'completed', label: t('study_group.status_completed') },
    { value: 'expired', label: t('study_group.status_expired') },
  ];
  const joinedStatusOptions: { value: 'all' | JoinedStatusFilter; label: string }[] = [
    { value: 'all', label: t('study_group.status_all') },
    { value: 'approved', label: t('study_group.participation_approved') },
    { value: 'pending', label: t('study_group.participation_pending') },
    { value: 'denied', label: t('study_group.participation_denied') },
    { value: 'expired', label: t('study_group.participation_expired') },
  ];
  const currentItems = useMemo(() => activeTab === 'created'
    ? createdGroups.filter((group) => createdStatuses.length === 0 || createdStatuses.includes(group.userStatus as CreatedStatusFilter))
    : activeTab === 'joined'
      ? joinedGroups.filter((group) => joinedStatuses.length === 0 || joinedStatuses.includes(group.userApplicantStatus as JoinedStatusFilter))
      : [],
  [activeTab, createdGroups, createdStatuses, joinedGroups, joinedStatuses]);
  const totalPages = activeTab === 'invitations'
    ? Math.ceil(invitations.length / invitationsPerPage)
    : Math.ceil(currentItems.length / itemsPerPage);
  const displayedItems = currentItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const displayedInvitations = invitations.slice((currentPage - 1) * invitationsPerPage, currentPage * invitationsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
      <div className="w-full min-h-screen bg-[#F3EFEA] dark:bg-neutral-900 py-12 px-6">
        <div className="max-w-[1040px] mx-auto space-y-6">
          
          {/* Header */}
          <div className="flex flex-col items-start gap-4 w-full">
            <h1 className="text-[#000] dark:text-white font-hankenGrotesk text-[32px] font-bold leading-10 tracking-[-0.02em]">
              {t('study_group.dashboard_title')}
            </h1>
            <div className="flex items-start gap-8 border-b border-[#C2C7CF] dark:border-neutral-800 w-full">
              <button 
                onClick={() => handleTabChange('created')}
                className={`pb-4 border-b-2 font-hankenGrotesk text-sm transition-colors ${activeTab === 'created' ? 'border-[#42474E] dark:border-white text-[#595C61] dark:text-white font-bold' : 'border-transparent text-[#42474E] dark:text-gray-400 hover:text-black dark:hover:text-white'}`}
              >
                {t('study_group.groups_created')}
              </button>
              <button 
                onClick={() => handleTabChange('joined')}
                className={`pb-4 border-b-2 font-hankenGrotesk text-sm transition-colors ${activeTab === 'joined' ? 'border-[#42474E] dark:border-white text-[#595C61] dark:text-white font-bold' : 'border-transparent text-[#42474E] dark:text-gray-400 hover:text-black dark:hover:text-white'}`}
              >
                {t('study_group.groups_joined')}
              </button>
              <button
                onClick={() => handleTabChange('invitations')}
                className={`flex items-center gap-2 pb-4 border-b-2 font-hankenGrotesk text-sm transition-colors ${activeTab === 'invitations' ? 'border-[#42474E] dark:border-white text-[#595C61] dark:text-white font-bold' : 'border-transparent text-[#42474E] dark:text-gray-400 hover:text-black dark:hover:text-white'}`}
              >
                {t('study_group.groups_invitations')}
                {invitations.length > 0 && <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-[#006A61] px-1.5 py-0.5 text-[10px] font-bold leading-4 text-white dark:bg-teal-600">{invitations.length}</span>}
              </button>
            </div>
          </div>

          <div className="space-y-12">
            <section className="space-y-6 animate-fade-in">
              {activeTab !== 'invitations' && <div className="flex flex-wrap items-center gap-2" role="group" aria-label={t('study_group.filter_status')}>
                {(activeTab === 'created' ? createdStatusOptions : joinedStatusOptions).map((option) => {
                  const selected = option.value === 'all'
                    ? (activeTab === 'created' ? createdStatuses.length === 0 : joinedStatuses.length === 0)
                    : (activeTab === 'created'
                        ? createdStatuses.includes(option.value as CreatedStatusFilter)
                        : joinedStatuses.includes(option.value as JoinedStatusFilter));
                  return (
                    <button
                      key={option.value}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => {
                        if (activeTab === 'created') {
                          setCreatedStatuses((statuses) => option.value === 'all'
                            ? []
                            : statuses.includes(option.value as CreatedStatusFilter)
                              ? statuses.filter((status) => status !== option.value)
                              : [...statuses, option.value as CreatedStatusFilter]);
                        } else {
                          setJoinedStatuses((statuses) => option.value === 'all'
                            ? []
                            : statuses.includes(option.value as JoinedStatusFilter)
                              ? statuses.filter((status) => status !== option.value)
                              : [...statuses, option.value as JoinedStatusFilter]);
                        }
                        setCurrentPage(1);
                      }}
                      className={`rounded-full border px-4 py-2 font-hankenGrotesk text-sm font-semibold transition-colors ${selected ? 'border-[#42474E] bg-[#42474E] text-white dark:border-white dark:bg-white dark:text-[#1F1F1F]' : 'border-[#C2C7CF] bg-transparent text-[#595C61] hover:border-[#42474E] hover:text-[#1F1F1F] dark:border-neutral-700 dark:text-neutral-300 dark:hover:border-neutral-500 dark:hover:text-white'}`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>}
              {loading && <p role="status" className="py-12 text-center text-[#595C61] dark:text-gray-300">Loading Study Groups…</p>}
              {loadError && <div role="alert" className="rounded-xl bg-red-50 p-4 text-red-800 dark:bg-red-950/30 dark:text-red-200">{loadError}<button onClick={() => void loadGroups()} className="ml-3 underline transition-opacity hover:opacity-70">Retry</button></div>}
              {activeTab === 'invitations' && invitationError && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">{invitationError}</div>}
              {!loading && !loadError && activeTab === 'invitations' && (
                invitations.length > 0
                  ? <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                      {displayedInvitations.map((invitation) => <StudyGroupInvitationCard key={invitation.requestId} invitation={invitation} acting={actingInvitationId === invitation.requestId} onAccept={(item) => void handleInvitationDecision(item, 'accept')} onDecline={(item) => void handleInvitationDecision(item, 'deny')} />)}
                    </div>
                  : <div className="rounded-2xl border border-dashed border-[#C8BEB3] bg-[#FFFDF9]/70 px-6 py-14 text-center dark:border-neutral-700 dark:bg-neutral-900/50"><p className="font-manrope text-lg font-bold text-[#253442] dark:text-white">{t('study_group.no_pending_invitations')}</p><p className="mt-2 text-sm text-[#716B65] dark:text-neutral-400">{t('study_group.no_pending_invitations_description')}</p></div>
              )}
              {!loading && !loadError && activeTab !== 'invitations' && <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {displayedItems.map((group) => (
                  <div key={group.id} className="transition-transform">
                    <StudyGroupCard
                      {...group}
                      viewMode={activeTab}
                      onCardClick={(id) => handleCardClick(id, activeTab)}
                    />
                  </div>
                ))}
              </div>}

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-8">
                  <button
                    onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
                    disabled={currentPage === 1}
                    className="w-8 h-8 flex items-center justify-center rounded-lg font-inter text-sm font-semibold bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-300 dark:hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    aria-label="Previous page"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                  </button>

                  {(() => {
                    const pages = [];
                    const range = 1;

                    if (totalPages > 1) {
                      pages.push(
                        <button
                          key={1}
                          onClick={() => handlePageChange(1)}
                          className={`w-8 h-8 rounded-lg font-inter text-sm font-semibold transition-colors cursor-pointer ${
                            currentPage === 1 ? "bg-[#006A61] dark:bg-teal-600 text-white" : "bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-300 dark:hover:bg-neutral-700"
                          }`}
                        >
                          1
                        </button>
                      );
                    }

                    if (currentPage > range + 2) {
                      pages.push(<span key="left-dots" className="px-1 text-neutral-500 font-bold">...</span>);
                    }

                    const start = Math.max(2, currentPage - range);
                    const end = Math.min(totalPages - 1, currentPage + range);

                    for (let i = start; i <= end; i++) {
                      pages.push(
                        <button
                          key={i}
                          onClick={() => handlePageChange(i)}
                          className={`w-8 h-8 rounded-lg font-inter text-sm font-semibold transition-colors cursor-pointer ${
                            currentPage === i ? "bg-[#006A61] dark:bg-teal-600 text-white" : "bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-300 dark:hover:bg-neutral-700"
                          }`}
                        >
                          {i}
                        </button>
                      );
                    }

                    if (currentPage < totalPages - range - 1) {
                      pages.push(<span key="right-dots" className="px-1 text-neutral-500 font-bold">...</span>);
                    }

                    if (totalPages > 1) {
                      pages.push(
                        <button
                          key={totalPages}
                          onClick={() => handlePageChange(totalPages)}
                          className={`w-8 h-8 rounded-lg font-inter text-sm font-semibold transition-colors cursor-pointer ${
                            currentPage === totalPages ? "bg-[#006A61] dark:bg-teal-600 text-white" : "bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-300 dark:hover:bg-neutral-700"
                          }`}
                        >
                          {totalPages}
                        </button>
                      );
                    }

                    return pages;
                  })()}

                  <button
                    onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="w-8 h-8 flex items-center justify-center rounded-lg font-inter text-sm font-semibold bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-300 dark:hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    aria-label="Next page"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </button>
                </div>
              )}
            </section>
          </div>

        </div>
        <StudyGroupInfoModal
          isOpen={!!selectedGroup}
          onClose={closeGroupDetails}
          group={selectedGroup}
          viewMode={modalMode}
          onChanged={() => void loadGroups(true)}
        />
        {selectedGroupId && !selectedGroup && (routeGroupLoading || routeGroupError) && (
          <div
            className="fixed inset-0 z-[190] flex items-center justify-center bg-[#07111F]/55 px-4 backdrop-blur-[2px]"
            role="presentation"
            onMouseDown={(event) => {
              if (routeGroupError && event.target === event.currentTarget) closeGroupDetails();
            }}
          >
            <div role={routeGroupError ? 'alertdialog' : 'status'} aria-live="polite" className="w-full max-w-sm rounded-2xl border border-[#E1D9D0] bg-[#FFFDF9] p-6 text-center text-[#0B1C30] shadow-[0_28px_80px_rgba(7,17,31,.3)] dark:border-neutral-700 dark:bg-neutral-900 dark:text-white">
              {routeGroupLoading ? (
                <>
                  <span className="mx-auto block h-8 w-8 animate-spin rounded-full border-2 border-[#B9C8CE] border-t-[#0A3240] dark:border-neutral-700 dark:border-t-white" aria-hidden="true" />
                  <p className="mt-4 font-manrope text-sm font-semibold">{t('study_group.route_loading')}</p>
                </>
              ) : (
                <>
                  <h2 className="font-hankenGrotesk text-xl font-bold">{t('study_group.route_not_found_title')}</h2>
                  <p className="mt-2 text-sm leading-6 text-[#65696E] dark:text-neutral-300">{routeGroupError}</p>
                  <button onClick={closeGroupDetails} className="mt-5 rounded-xl bg-[#0A3240] px-5 py-2.5 font-manrope text-sm font-bold text-white transition-colors hover:bg-[#164A59]">
                    {t('study_group.back_to_groups')}
                  </button>
                </>
              )}
            </div>
          </div>
        )}
        {notice && <div role="status" className="fixed bottom-6 right-6 z-[100] rounded-xl bg-[#0A3240] px-5 py-3 text-sm font-semibold text-white shadow-xl">{notice}</div>}
      </div>
  );
}

interface YourStudyGroupsPageProps {
  initialGroupId?: string | null;
  initialMode?: DashboardGroupMode | null;
}

export default function YourStudyGroupsPage({ initialGroupId = null, initialMode = null }: YourStudyGroupsPageProps) {
  return <I18nProvider><YourStudyGroupsContent initialGroupId={initialGroupId} initialMode={initialMode} /></I18nProvider>;
}
