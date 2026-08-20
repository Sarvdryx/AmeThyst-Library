"use client";
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import NavBar from '../components/organisms/NavBar';
import Footer from '../components/organisms/Footer';
import StudyGroupGrid from '../components/organisms/StudyGroupGrid';
import StudyGroupFilter from '../components/molecules/StudyGroupFilter';
import RequestToJoinModal from '../components/organisms/RequestToJoinModal';
import StudyGroupInfoModal from '../components/organisms/StudyGroupInfoModal';
import { StudyGroup } from './mockData';
import { useI18n } from '../providers/I18nProvider';
import { acceptStudyGroupInvitation, cancelJoinRequest, getStudyGroup, listStudyGroupFilterOptions, listStudyGroups, requestToJoin, toLegacyStudyGroup } from '../utils/studyGroup';
import type { StudyGroupFilterBranch } from '../types/studyGroup';
import { getAuthToken, getLoggedInUser, isLoggedIn, useStoredUser } from '../utils/user';
import { useSocket } from '../utils/useSocket';
import { Button } from '../components/atoms/Button';
import { isStaffRole } from '../utils/roles';

interface StudyTogetherPageProps {
  initialGroupId?: string | null;
}

const groupIdFromPath = () => {
  const match = window.location.pathname.match(/^\/study-together\/([^/]+)\/?$/);
  if (!match) return null;
  try { return decodeURIComponent(match[1]); } catch { return match[1]; }
};

export default function StudyTogetherPage({ initialGroupId = null }: StudyTogetherPageProps) {
  const { t } = useI18n();
  const router = useRouter();
  const storedUser = useStoredUser();
  const isStaffViewer = isStaffRole(storedUser?.role);

  // Filter & Sort State
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [startTimeFilter, setStartTimeFilter] = useState('');
  const [endTimeFilter, setEndTimeFilter] = useState('');
  const [branches, setBranches] = useState<StudyGroupFilterBranch[]>([]);
  const [selectedBranchIds, setSelectedBranchIds] = useState<number[]>([]);
  const [selectedRoomIds, setSelectedRoomIds] = useState<number[]>([]);
  const [studyGroups, setStudyGroups] = useState<StudyGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [joiningGroups, setJoiningGroups] = useState<string[]>([]);
  const hasLoadedGroups = useRef(false);
  const loadSequence = useRef(0);

  const loadGroups = useCallback(async (silent = false) => {
    const sequence = ++loadSequence.current;
    if (!silent && !hasLoadedGroups.current) { setLoading(true); setLoadError(null); }
    const result = await listStudyGroups({ page: 1, pageSize: 50, search: searchQuery, date: dateFilter, startTime: startTimeFilter, endTime: endTimeFilter, branchIds: selectedBranchIds.join(','), roomIds: selectedRoomIds.join(',') });
    if (sequence !== loadSequence.current) return;
    if (result.success && result.data) {
      const authenticated = isLoggedIn();
      const uniqueGroups = [...new Map(result.data.map((group) => [group.groupId, group])).values()];
      setStudyGroups(uniqueGroups.map((group) => {
        const pendingInvitation = group.currentUserParticipation?.type === 'invite' && group.currentUserParticipation.status === 'pending';
        return { ...toLegacyStudyGroup(group, undefined, t), canJoin: authenticated ? !isStaffViewer && (group.canJoin || pendingInvitation) : true };
      }));
    }
    else { setStudyGroups([]); setLoadError(result.message || t('study_group.load_error')); }
    hasLoadedGroups.current = true;
    if (!silent) setLoading(false);
  }, [dateFilter, endTimeFilter, isStaffViewer, searchQuery, selectedBranchIds, selectedRoomIds, startTimeFilter, t]);

  useEffect(() => {
    const debounce = window.setTimeout(() => void loadGroups(hasLoadedGroups.current), hasLoadedGroups.current ? 250 : 0);
    const timer = window.setInterval(() => void loadGroups(true), 30_000);
    const refreshVisible = () => { if (document.visibilityState === 'visible') void loadGroups(true); };
    document.addEventListener('visibilitychange', refreshVisible);
    return () => { window.clearTimeout(debounce); window.clearInterval(timer); document.removeEventListener('visibilitychange', refreshVisible); };
  }, [loadGroups]);

  useEffect(() => {
    void listStudyGroupFilterOptions().then((result) => {
      if (result.success && result.data) {
        setBranches(result.data);
        setSelectedBranchIds(result.data.map((branch) => branch.branchId));
      }
    });
  }, []);

  const socket = useSocket(getAuthToken());
  useEffect(() => {
    if (!socket) return;
    const refresh = () => void loadGroups(true);
    socket.on('study-group:changed', refresh);
    return () => { socket.off('study-group:changed', refresh); };
  }, [loadGroups, socket]);

  // Modal States
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(() => typeof window !== 'undefined' && isLoggedIn() && !isStaffRole(getLoggedInUser()?.role) ? new URLSearchParams(window.location.search).get('join') : null);
  const [infoGroupId, setInfoGroupId] = useState<string | null>(initialGroupId);
  const [routedGroup, setRoutedGroup] = useState<StudyGroup | null>(null);
  const [routeGroupLoading, setRouteGroupLoading] = useState(Boolean(initialGroupId));
  const [routeGroupError, setRouteGroupError] = useState<string | null>(null);
  const [cancelGroupId, setCancelGroupId] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  // Filtered & Sorted Groups
  const displayedGroups = useMemo(() => {
    return [...studyGroups].sort((left, right) =>
      Number(right.userApplicantStatus === 'pending') - Number(left.userApplicantStatus === 'pending'));
  }, [studyGroups]);

  const [pendingRequests, setPendingRequests] = useState<string[]>([]);

  const handleJoinGroup = async (id: string) => {
    if (!isLoggedIn()) {
      window.location.href = `/login?returnTo=${encodeURIComponent(`/study-together?join=${id}`)}`;
      return;
    }
    if (isStaffViewer) return;
    const group = studyGroups.find((item) => item.id === id);
    if (group?.participationType === 'invite' && group.userApplicantStatus === 'pending' && group.participationRequestId) {
      if (joiningGroups.includes(id)) return;
      setJoiningGroups((current) => [...new Set([...current, id])]);
      const result = await acceptStudyGroupInvitation(id, group.participationRequestId);
      if (!result.success) {
        alert(result.message || t('study_group.invitation_action_error'));
        setJoiningGroups((current) => current.filter((groupId) => groupId !== id));
        await loadGroups(true);
        return;
      }
      await loadGroups(true);
      setJoiningGroups((current) => current.filter((groupId) => groupId !== id));
      router.push(`/dashboard/user/yourstudygroups/joined/${encodeURIComponent(id)}`);
      return;
    }
    setSelectedGroupId(id);
  };

  const handleCloseModal = () => {
    setSelectedGroupId(null);
  };

  const handleSendMessage = async (message: string) => {
    if (!selectedGroupId) return;
    const groupId = selectedGroupId;
    
    setPendingRequests((current) => [...new Set([...current, groupId])]);
    setSelectedGroupId(null);

    try {
      const result = await requestToJoin(groupId, message);
      if (!result.success && result.error?.code !== 'DUPLICATE_PARTICIPATION') {
        alert(result.message || 'Failed to submit join request. Please try again.');
      }
    } finally {
      await loadGroups(true);
      setPendingRequests((current) => current.filter((id) => id !== groupId));
    }
  };

  const selectedGroup = useMemo(() => {
    return studyGroups.find(g => g.id === selectedGroupId) || null;
  }, [selectedGroupId, studyGroups]);

  const infoGroup = useMemo(
    () => studyGroups.find((group) => group.id === infoGroupId) || (routedGroup?.id === infoGroupId ? routedGroup : null),
    [infoGroupId, routedGroup, studyGroups],
  );

  useEffect(() => {
    const syncRoute = () => {
      const groupId = groupIdFromPath();
      setInfoGroupId(groupId);
      if (!groupId) {
        setRoutedGroup(null);
        setRouteGroupError(null);
        setRouteGroupLoading(false);
      }
    };
    window.addEventListener('popstate', syncRoute);
    return () => window.removeEventListener('popstate', syncRoute);
  }, []);

  useEffect(() => {
    if (!infoGroupId || studyGroups.some((group) => group.id === infoGroupId)) {
      // Route state mirrors the selected URL and must reset when its group is already available in the list.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRouteGroupLoading(false);
      setRouteGroupError(null);
      return;
    }
    let active = true;
    setRouteGroupLoading(true);
    setRouteGroupError(null);
    void getStudyGroup(infoGroupId).then((result) => {
      if (!active) return;
      if (result.success && result.data) {
        setRoutedGroup(toLegacyStudyGroup(result.data, undefined, t));
      } else {
        setRoutedGroup(null);
        const unavailable = result.error?.code === 'NOT_FOUND' || result.error?.code === 'VALIDATION_ERROR';
        setRouteGroupError(t(unavailable ? 'study_group.route_not_found' : 'study_group.route_load_error'));
      }
      setRouteGroupLoading(false);
    });
    return () => { active = false; };
  }, [infoGroupId, studyGroups, t]);

  const openGroupDetails = (id: string) => {
    window.history.pushState({ studyTogetherModal: true }, '', `/study-together/${encodeURIComponent(id)}`);
    setRouteGroupError(null);
    setInfoGroupId(id);
  };

  const closeGroupDetails = () => {
    setInfoGroupId(null);
    setRoutedGroup(null);
    setRouteGroupError(null);
    if (window.history.state?.studyTogetherModal) {
      window.history.back();
      return;
    }
    router.replace('/study-together', { scroll: false });
  };

  const confirmCancelRequest = async () => {
    const group = studyGroups.find((item) => item.id === cancelGroupId);
    if (!group?.participationRequestId) return;
    setCancelling(true);
    setCancelError(null);
    const result = await cancelJoinRequest(group.id, group.participationRequestId);
    if (!result.success) {
      setCancelError(result.message || t('study_group.action_error'));
      setCancelling(false);
      return;
    }
    setCancelGroupId(null);
    setCancelling(false);
    await loadGroups(true);
  };

  return (
    <div className="min-h-screen bg-[#F3EFEA] dark:bg-neutral-950 transition-colors duration-300">
      <NavBar />
      
      <main className="max-w-7xl mx-auto px-4 py-12 min-h-[calc(100vh-84px-200px)]">
        <div className="flex flex-col gap-8">
          
          {/* Header */}
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold font-manrope text-navy dark:text-white">
              {t('study_together.title')}
            </h1>
            <p className="text-[#75777D] dark:text-gray-400 font-inter max-w-2xl">
              {t('study_together.description')}
            </p>
          </div>

          {/* Filters & Sort */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-neutral-900 p-4 rounded-xl border border-[#EAEAEA] dark:border-neutral-800 shadow-sm">
            <StudyGroupFilter 
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              dateFilter={dateFilter}
              onDateChange={setDateFilter}
              startTimeFilter={startTimeFilter}
              endTimeFilter={endTimeFilter}
              onStartTimeChange={setStartTimeFilter}
              onEndTimeChange={setEndTimeFilter}
              branches={branches}
              selectedBranchIds={selectedBranchIds}
              selectedRoomIds={selectedRoomIds}
              onBranchToggle={(branchId) => setSelectedBranchIds((current) => {
                if (current.includes(branchId)) {
                  if (current.length === 1) return current;
                  const next = current.filter((id) => id !== branchId);
                  const allowedRooms = new Set(branches.filter((branch) => next.includes(branch.branchId)).flatMap((branch) => branch.rooms.map((room) => room.roomId)));
                  setSelectedRoomIds((rooms) => rooms.filter((roomId) => allowedRooms.has(roomId)));
                  return next;
                }
                return [...current, branchId];
              })}
              onRoomToggle={(roomId) => setSelectedRoomIds((current) => current.includes(roomId) ? current.filter((id) => id !== roomId) : [...current, roomId])}
              onAllRooms={() => setSelectedRoomIds([])}
            />
          </div>

          {/* Content */}
          {loading && <p role="status" className="py-20 text-center text-[#75777D] dark:text-gray-400">{t('study_group.loading')}</p>}
          {loadError && <div role="alert" className="rounded-xl bg-red-50 p-4 text-red-800 dark:bg-red-950/30 dark:text-red-200">{loadError}<button onClick={() => void loadGroups()} className="ml-3 underline transition-opacity hover:opacity-70">{t('study_group.retry')}</button></div>}
          {!loading && !loadError && <StudyGroupGrid
            groups={displayedGroups} 
            onJoinGroup={handleJoinGroup}
            onCardClick={openGroupDetails}
            onCancelRequest={(id) => { setCancelError(null); setCancelGroupId(id); }}
            pendingRequests={pendingRequests}
            joiningGroups={joiningGroups}
          />}
        </div>
      </main>

      <RequestToJoinModal 
        isOpen={selectedGroupId !== null}
        onClose={handleCloseModal}
        onSend={handleSendMessage}
        group={selectedGroup}
      />
      <StudyGroupInfoModal
        isOpen={infoGroup !== null}
        onClose={closeGroupDetails}
        group={infoGroup}
      />
      {infoGroupId && !infoGroup && (routeGroupLoading || routeGroupError) && (
        <div className="fixed inset-0 z-[190] flex items-center justify-center bg-[#07111F]/55 px-4 backdrop-blur-[2px]" role="presentation">
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

      {cancelGroupId && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#07111F]/55 p-5 backdrop-blur-sm animate-fade-in" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !cancelling) setCancelGroupId(null); }}>
          <div role="alertdialog" aria-modal="true" aria-labelledby="study-together-cancel-title" aria-describedby="study-together-cancel-description" className="w-full max-w-sm rounded-2xl border border-[#E7DED4] bg-[#FFFDF9] p-6 shadow-[0_24px_70px_rgba(7,17,31,0.28)] dark:border-neutral-700 dark:bg-neutral-900">
            <div className="flex items-center justify-between gap-4">
              <h3 id="study-together-cancel-title" className="font-manrope text-xl font-bold text-[#0B1C30] dark:text-white">{t('study_group.cancel_request_title')}</h3>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#E8F0FA] text-[#315D87] dark:bg-blue-950/60 dark:text-blue-300">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6 6 18" /></svg>
              </div>
            </div>
            <p id="study-together-cancel-description" className="mt-2 text-sm leading-6 text-[#675F58] dark:text-neutral-300">{t('study_group.cancel_request_description')}</p>
            {cancelError && <p role="alert" className="mt-3 text-sm text-red-700 dark:text-red-300">{cancelError}</p>}
            <div className="mt-6 grid grid-cols-2 gap-3">
              <Button variant="secondary" className="min-h-11 w-full px-4 py-2.5 text-center text-sm" disabled={cancelling} onClick={() => setCancelGroupId(null)}>{t('study_group.keep_request')}</Button>
              <button disabled={cancelling} onClick={() => void confirmCancelRequest()} className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-[#0B1C30] px-4 py-2.5 text-center text-sm font-bold leading-5 text-white transition-colors hover:bg-[#20364E] disabled:cursor-wait disabled:opacity-60 dark:bg-white dark:text-[#0B1C30]">{cancelling ? t('study_group.cancelling_request') : t('study_group.cancel_request')}</button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
