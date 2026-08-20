"use client";
import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { StudyGroup } from '../../study-together/mockData';
import { Button, GroupInfoRow, CapacityBar, MemberCard, ModalCloseButton } from '../atoms';
import UserAvatar from '../atoms/UserAvatar';
import UserProfileHoverCard from '../molecules/UserProfileHoverCard';
import type { StudyGroupDetail } from '../../types/studyGroup';
import { approveJoinRequest, cancelJoinRequest, denyJoinRequest, dissolveStudyGroup, getStudyGroup, inviteStudyGroupMember, leaveStudyGroup, removeStudyGroupMember, updateStudyGroup } from '../../utils/studyGroup';
import { getAuthToken } from '../../utils/user';
import { useSocket } from '../../utils/useSocket';
import { useI18n } from '../../providers/I18nProvider';
import styles from './StudyGroupInfoModal.module.css';

interface StudyGroupInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: StudyGroup | null;
  viewMode?: 'explore' | 'joined' | 'created';
  onChanged?: () => void;
}

export default function StudyGroupInfoModal({ isOpen, onClose, group, viewMode = 'explore', onChanged }: StudyGroupInfoModalProps) {
  const { t } = useI18n();
  const [isEditing, setIsEditing] = React.useState(false);
  const [editForm, setEditForm] = React.useState({ title: '', description: '', subject: '', requirements: '' });
  const [detail, setDetail] = React.useState<StudyGroupDetail | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [showDissolveConfirm, setShowDissolveConfirm] = React.useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = React.useState(false);
  const [showCancelRequestConfirm, setShowCancelRequestConfirm] = React.useState(false);
  const [memberToRemove, setMemberToRemove] = React.useState<{ userId: string; name: string } | null>(null);
  const [inviteExpanded, setInviteExpanded] = React.useState(false);
  const [inviteEmail, setInviteEmail] = React.useState('');
  const [inviteSending, setInviteSending] = React.useState(false);
  const [inviteFeedback, setInviteFeedback] = React.useState<string | null>(null);
  const inviteInputRef = React.useRef<HTMLInputElement>(null);
  const inviteSessionRef = React.useRef(0);
  const contentScrollRef = React.useRef<HTMLDivElement>(null);
  const [contentScrollbar, setContentScrollbar] = React.useState({ visible: false, thumbHeight: 0, thumbTop: 0 });

  const updateContentScrollbar = React.useCallback(() => {
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
  }, [detail, isEditing, isOpen, updateContentScrollbar]);

  const loadDetail = React.useCallback(async () => {
    if (!group) return;
    const result = await getStudyGroup(group.id);
    if (result.success && result.data) setDetail(result.data);
    else setActionError(result.message || 'Unable to load Study Group details.');
  }, [group]);

  useEffect(() => {
    if (group) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEditForm({ 
        title: group.title, 
        description: group.description, 
        subject: group.subject,
        requirements: group.requirements?.join(', ') || '' 
      });
      setIsEditing(false);
      setShowDissolveConfirm(false);
      setShowLeaveConfirm(false);
      setShowCancelRequestConfirm(false);
      setMemberToRemove(null);
      setInviteExpanded(false);
      setInviteEmail('');
      setInviteFeedback(null);
    }
  }, [group]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { if (isOpen && group) void loadDetail(); }, [isOpen, group, loadDetail]);

  const socket = useSocket(getAuthToken());
  useEffect(() => {
    if (!socket || !isOpen || !group) return;
    const refresh = (event: { groupId?: string | null }) => { if (!event.groupId || event.groupId === group.id) void loadDetail(); };
    socket.on('study-group:changed', refresh);
    return () => { socket.off('study-group:changed', refresh); };
  }, [group, isOpen, loadDetail, socket]);

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

  useEffect(() => {
    inviteSessionRef.current += 1;
    const reset = window.setTimeout(() => {
      setInviteExpanded(false);
      setInviteEmail('');
      setInviteSending(false);
      setInviteFeedback(null);
      setActionError(null);
    }, 0);
    return () => window.clearTimeout(reset);
  }, [isOpen]);

  if (!isOpen || !group) return null;

  // Determine subject badge color (reuse from card)
  const getSubjectColor = (subj: string) => {
    const hash = subj.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const colors = [
      'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
      'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
      'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
      'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300',
      'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
      'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300',
      'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
    ];
    return colors[hash % colors.length];
  };

  const otherMembers = (detail?.approvedMembers || []).map((member) => ({
    name: member.user.username,
    initials: member.user.username.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase(),
    avatar: member.user.avatar,
    userId: member.user.userId,
    role: member.user.role || undefined,
    email: member.user.email,
    phoneNumber: member.user.phoneNumber,
    birthDate: member.user.birthDate,
    gender: member.user.gender,
    occupation: member.user.occupation,
    hometown: member.user.hometown,
    description: member.user.description,
  }));
  const organizerProfile = detail?.organizerProfile
    ? {
        name: detail.organizerProfile.username,
        initials: detail.organizerProfile.username.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase(),
        avatar: detail.organizerProfile.avatar,
        role: detail.organizerProfile.role,
        email: detail.organizerProfile.email,
        phoneNumber: detail.organizerProfile.phoneNumber,
        birthDate: detail.organizerProfile.birthDate,
        gender: detail.organizerProfile.gender,
        occupation: detail.organizerProfile.occupation,
        hometown: detail.organizerProfile.hometown,
        description: detail.organizerProfile.description,
      }
    : group.leader;
  const pendingApplicantCount = detail?.pendingRequests.length ?? group.pendingApplicants ?? 0;
  const currentMemberCount = detail?.currentMembers ?? group.currentMembers;
  const memberCapacity = detail?.capacity ?? group.maxMembers;
  const showMemberList = viewMode === 'explore'
    || viewMode === 'created'
    || (viewMode === 'joined' && group.userApplicantStatus === 'approved');

  const isCreatorReadOnly = viewMode === 'created' && ['inprogress', 'completed', 'cancelled', 'expired'].includes(group.userStatus || '');
  const canEdit = viewMode === 'created' && !isCreatorReadOnly && Boolean(detail?.permissions.canEdit);
  const mutate = async (operation: () => Promise<{ success: boolean; message?: string }>) => {
    setSaving(true); setActionError(null);
    const result = await operation();
    if (!result.success) setActionError(result.message || 'The action could not be completed.');
    else { await loadDetail(); onChanged?.(); }
    setSaving(false);
    return result.success;
  };
  const toggleInvite = () => {
    setInviteExpanded((expanded) => {
      const next = !expanded;
      if (next) window.setTimeout(() => inviteInputRef.current?.focus(), 0);
      else { setInviteEmail(''); setActionError(null); }
      return next;
    });
  };
  const sendInvite = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!inviteEmail.trim() || inviteSending) return;
    const submittedEmail = inviteEmail.trim();
    const session = ++inviteSessionRef.current;
    setInviteSending(true); setActionError(null); setInviteEmail(''); setInviteExpanded(false); setInviteFeedback(t('study_group.sending_invite'));
    const result = await inviteStudyGroupMember(group.id, { email: submittedEmail });
    if (session !== inviteSessionRef.current) return;
    setInviteSending(false);
    if (!result.success) {
      setInviteFeedback(null);
      setActionError(result.error?.code === 'USER_NOT_FOUND'
        ? t('study_group.invite_user_not_found')
        : result.error?.code === 'INELIGIBLE_INVITEE'
          ? t('study_group.invite_user_ineligible')
          : (result.message || t('study_group.invite_error')));
      setInviteEmail(submittedEmail); setInviteExpanded(true);
      window.setTimeout(() => inviteInputRef.current?.focus(), 0);
      return;
    }
    setInviteFeedback(t('study_group.invite_sent')); onChanged?.();
    window.setTimeout(() => { if (session === inviteSessionRef.current) setInviteFeedback(null); }, 3500);
  };
  const dissolve = async () => {
    setSaving(true); setActionError(null);
    const result = await dissolveStudyGroup(group.id);
    setSaving(false);
    if (!result.success) {
      setActionError(result.message || 'The Study Group could not be dissolved.');
      return;
    }
    setShowDissolveConfirm(false);
    onChanged?.();
    onClose();
  };
  const leave = async () => {
    setSaving(true); setActionError(null);
    const result = await leaveStudyGroup(group.id);
    setSaving(false);
    if (!result.success) {
      setActionError(result.error?.code === 'LEAVE_CUTOFF'
        ? t('study_group.leave_cutoff_error')
        : result.message || t('study_group.leave_error'));
      return;
    }
    setShowLeaveConfirm(false);
    onChanged?.();
    onClose();
  };
  const cancelRequest = async () => {
    if (!detail?.currentUserParticipation) return;
    setSaving(true); setActionError(null);
    const result = await cancelJoinRequest(group.id, detail.currentUserParticipation.requestId);
    setSaving(false);
    if (!result.success) {
      setActionError(result.message || 'The pending request could not be cancelled.');
      return;
    }
    setShowCancelRequestConfirm(false);
    onChanged?.();
    onClose();
  };
  const removeMember = async () => {
    if (!memberToRemove) return;
    const removed = await mutate(() => removeStudyGroupMember(group.id, memberToRemove.userId));
    if (removed) setMemberToRemove(null);
  };
  const saveChanges = async () => {
    const requirements = editForm.requirements.split(',').map((item) => item.trim()).filter(Boolean);
    if (!editForm.title.trim() || !editForm.description.trim() || !editForm.subject.trim() || !/\p{L}/u.test(editForm.title) || !/\p{L}/u.test(editForm.subject) || requirements.length > 5) {
      setActionError('Title, description, and subject are required; title and subject must contain a letter, with at most five requirements.');
      return;
    }
    if (await mutate(() => updateStudyGroup(group.id, { title: editForm.title, description: editForm.description, subject: editForm.subject, requirements }))) setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div 
        className={`relative bg-white ${viewMode === 'explore' ? 'dark:bg-neutral-900 dark:border-neutral-800' : 'dark:bg-[#1F1F1F] dark:border-neutral-700'} rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl animate-scale-up border border-[#EAEAEA] flex flex-col max-h-[90vh]`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Main Content Area */}
        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
        <div ref={contentScrollRef} onScroll={updateContentScrollbar} className={`${styles.studyGroupScroller} flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-6 pr-8 md:p-8 md:pr-10`}>
          
          {/* Header Section */}
          <div className="flex flex-col items-start gap-6 w-full">
            <div className="flex min-w-0 w-full flex-col gap-3">
                <div className="flex min-w-0 w-full items-center justify-between gap-4">
                  <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                  {isEditing ? <input value={editForm.subject} maxLength={30} onChange={(event) => setEditForm({ ...editForm, subject: event.target.value })} className="max-w-[180px] rounded-full border border-neutral-300 bg-transparent px-3 py-1.5 text-xs font-bold dark:border-neutral-700" /> : <span className={`max-w-full whitespace-normal break-words [overflow-wrap:anywhere] text-xs font-bold px-3 py-1.5 rounded-full ${getSubjectColor(group.subject)}`}>{group.subject}</span>}
                  {viewMode === 'created' && group.userStatus && (
                    <span className={`text-[13px] font-bold px-3 py-1 rounded-full shrink-0 ${
                      group.userStatus === 'upcoming' ? 'bg-[#D8E3FB] text-[#0C447C]' : 
                      group.userStatus === 'inprogress' ? 'bg-[#86F2E4] text-[#27500A]' : 
                      group.userStatus === 'cancelled' ? 'bg-[#FBD8D8] text-[#7C0C0C]' :
                      group.userStatus === 'completed' ? 'bg-[#E8D8FB] text-[#4C0C7C]' :
                      'bg-gray-200 text-gray-800'
                    }`}>
                      {group.userStatus.charAt(0).toUpperCase() + group.userStatus.slice(1)}
                    </span>
                  )}
                  {viewMode === 'joined' && group.userApplicantStatus && (
                    <span className={`text-[13px] font-bold px-3 py-1 rounded-full shrink-0 ${
                      group.userApplicantStatus === 'approved' ? 'bg-[#D8FBD8] text-[#0C7C0C]' : 
                      group.userApplicantStatus === 'pending' ? 'bg-[#FBEED8] text-[#7C5C0C]' : 
                      'bg-[#FBD8D8] text-[#7C0C0C]'
                    }`}>
                      {group.userApplicantStatus.charAt(0).toUpperCase() + group.userApplicantStatus.slice(1)}
                    </span>
                  )}
                  </div>
                  <div className="flex shrink-0 items-center gap-4">
                    {canEdit && (
                      <button disabled={saving} onClick={() => isEditing ? void saveChanges() : setIsEditing(true)} className="flex items-center gap-1 whitespace-nowrap text-[#45464D] dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors disabled:opacity-50">
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M2 16H3.425L13.2 6.225L11.775 4.8L2 14.575V16ZM0 18V13.75L13.2 0.575C13.4 0.391667 13.6208 0.25 13.8625 0.15C14.1042 0.05 14.3583 0 14.625 0C14.8917 0 15.15 0.05 15.4 0.15C15.65 0.25 15.8667 0.4 16.05 0.6L17.425 2C17.625 2.18333 17.7708 2.4 17.8625 2.65C17.9542 2.9 18 3.15 18 3.4C18 3.66667 17.9542 3.92083 17.8625 4.1625C17.7708 4.40417 17.625 4.625 17.425 4.825L4.25 18H0ZM16 3.4L14.6 2L16 3.4ZM12.475 5.525L11.775 4.8L13.2 6.225L12.475 5.525Z" fill="currentColor"/>
                        </svg>
                        <span className="font-inter text-sm font-medium">{isEditing ? 'Save Settings' : 'Edit Settings'}</span>
                      </button>
                    )}
                    <ModalCloseButton onClick={onClose} />
                  </div>
                </div>
                {isEditing ? (
                  <input 
                    type="text" 
                    value={editForm.title} 
                    onChange={e => setEditForm({...editForm, title: e.target.value})}
                    className="w-full min-w-0 text-[#000] dark:text-white font-inter text-3xl font-semibold leading-tight tracking-tight border-b border-gray-300 dark:border-neutral-700 bg-transparent focus:outline-none"
                  />
                ) : (
                  <h2 className="w-full min-w-0 whitespace-normal break-words [overflow-wrap:anywhere] text-[#000] dark:text-white font-inter text-3xl font-semibold leading-tight tracking-tight">
                    {group.title}
                  </h2>
                )}
            </div>

            {/* Time & Location Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
              <GroupInfoRow label="TIME RANGE" value={group.time} />
              <GroupInfoRow label="LOCATION" value={group.address} />
              <GroupInfoRow label="ROOM" value={group.room} />
            </div>
          </div>

          {actionError && <div role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950/30 dark:text-red-200">{actionError}</div>}

          <hr className="border-[#EAEAEA] dark:border-neutral-800" />

          {/* Description & Requirements */}
          <div className="flex flex-col gap-6 w-full">
            <div className="flex flex-col gap-2">
              <p className="text-[#45464D] dark:text-gray-400 font-inter text-xs font-semibold leading-3 tracking-wider uppercase">
                Description
              </p>
              {isEditing ? (
                <textarea 
                  value={editForm.description}
                  onChange={e => setEditForm({...editForm, description: e.target.value})}
                  className="w-full text-[#0D1C2E] dark:text-gray-200 font-inter text-base leading-relaxed border border-gray-300 dark:border-neutral-700 rounded-md p-2 bg-transparent focus:outline-none min-h-[100px]"
                />
              ) : (
                <p className="min-w-0 break-words [overflow-wrap:anywhere] text-[#0D1C2E] dark:text-gray-200 font-inter text-base leading-relaxed">
                  {group.description}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2 mt-2">
              <p className="text-[#45464D] dark:text-gray-400 font-inter text-xs font-semibold leading-3 tracking-wider uppercase">
                Requirements
              </p>
              {isEditing ? (
                <textarea 
                  value={editForm.requirements}
                  onChange={e => setEditForm({...editForm, requirements: e.target.value})}
                  placeholder="Comma separated requirements"
                  className="w-full text-[#0D1C2E] dark:text-gray-200 font-inter text-sm border border-gray-300 dark:border-neutral-700 rounded-md p-2 bg-transparent focus:outline-none min-h-[60px]"
                />
              ) : (
                group.requirements && group.requirements.length > 0 ? (
                  <ul className="list-disc list-inside text-[#0D1C2E] dark:text-gray-200 font-inter text-sm flex flex-col gap-1.5 mt-1">
                    {group.requirements.map((req, idx) => (
                      <li key={idx} className="break-words [overflow-wrap:anywhere]">{req}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 text-sm italic">None</p>
                )
              )}
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-6 w-full">
            <div className={`flex flex-col gap-6 w-full ${viewMode === 'created' && pendingApplicantCount > 0 ? 'md:w-2/3' : ''}`}>
              {/* Capacity & Leader */}
              <div className="flex flex-col gap-6 w-full">
                <div className="flex justify-between items-end w-full">
                  <div className="flex flex-col justify-center items-start gap-1">
                    <h3 className="text-[#0D1C2E] dark:text-white font-inter text-xl font-semibold leading-tight tracking-tight">
                      Group Organizer
                    </h3>
                    <p className="text-[#45464D] dark:text-gray-400 font-inter text-sm leading-6">
                      Contact the organizer if you have specific questions before joining.
                    </p>
                  </div>

                  <CapacityBar current={currentMemberCount} max={memberCapacity} />
                </div>

                {/* Leader Card */}
                <div className="flex p-4 md:px-6 md:py-5 justify-between items-center border border-[#C6C6CD] dark:border-neutral-800 bg-[#F8F9FF] dark:bg-neutral-800/50 rounded-xl w-full">
                  <UserProfileHoverCard user={organizerProfile}>
                    <span className="flex items-center gap-4">
                      <UserAvatar avatar={group.leader.avatar} initials={group.leader.initials} alt={group.leader.name} className="h-12 w-12" fallbackClassName="rounded-xl bg-[#E5F3F2] text-lg text-[#006A61] dark:bg-teal-900/30 dark:text-teal-400" />
                      <span className="flex flex-col items-start">
                        <span className="font-inter text-base font-bold leading-6 text-[#000] dark:text-white">
                          {group.leader.name}
                        </span>
                        <span className="font-inter text-xs uppercase leading-[18px] tracking-wider text-[#45464D] dark:text-gray-400">
                          ORGANIZER
                        </span>
                      </span>
                    </span>
                  </UserProfileHoverCard>
                </div>
              </div>

              {/* Other Members */}
              {showMemberList && (otherMembers.length > 0 || viewMode === 'created') && (
                <div className="flex flex-col gap-4 mt-2">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h3 className="text-[#0D1C2E] dark:text-white font-inter text-lg font-semibold">{t('study_group.members')}</h3>
                    {viewMode === 'created' && canEdit && currentMemberCount < memberCapacity && <form onSubmit={sendInvite} className="flex items-center" aria-label={t('study_group.invite_by_email')}>
                      <div className={`overflow-hidden transition-[width,opacity,margin] duration-200 ease-out ${inviteExpanded ? 'mr-2 w-52 opacity-100' : 'mr-0 w-0 opacity-0'}`}>
                        <input ref={inviteInputRef} type="email" required tabIndex={inviteExpanded ? 0 : -1} value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} disabled={inviteSending} placeholder={t('study_group.invitee_email_placeholder')} className="h-8 w-52 rounded-full border border-[#AEB8BD] bg-white px-3 text-xs text-[#20252A] outline-none focus:border-[#315A6B] dark:border-neutral-600 dark:bg-neutral-900 dark:text-white" />
                      </div>
                      <button type="button" onClick={toggleInvite} disabled={inviteSending} className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#315A6B]/40 ${inviteExpanded ? 'border-[#315A6B] bg-[#315A6B] text-white' : 'border-[#AEB8BD] text-[#315A6B] hover:border-[#315A6B] hover:bg-[#E8F0F2] hover:shadow-sm dark:border-neutral-600 dark:text-sky-200 dark:hover:bg-neutral-800'}`} aria-label={inviteExpanded ? t('study_group.close_invite_input') : t('study_group.invite_by_email')} title={inviteExpanded ? t('study_group.close_invite_input') : t('study_group.invite_by_email')}><svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6M22 11h-6"/></svg></button>
                      {inviteExpanded && <button type="submit" className="sr-only">{t('study_group.send_invite')}</button>}
                    </form>}
                    {inviteFeedback && <span role="status" className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">{inviteFeedback}</span>}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {otherMembers.map((member) => (
                      <MemberCard
                        key={member.userId}
                        name={member.name}
                        initials={member.initials}
                        avatar={member.avatar}
                        role={member.role}
                        email={member.email}
                        phoneNumber={member.phoneNumber}
                        birthDate={member.birthDate}
                        gender={member.gender}
                        occupation={member.occupation}
                        hometown={member.hometown}
                        description={member.description}
                        canKick={canEdit}
                        onKick={() => { setActionError(null); setMemberToRemove({ userId: member.userId, name: member.name }); }}
                      />
                    ))}
                    {otherMembers.length === 0 && <p className="col-span-full rounded-xl border border-dashed border-[#C6C6CD] px-4 py-5 text-center text-sm text-[#696D72] dark:border-neutral-700 dark:text-neutral-400">{t('study_group.no_additional_members')}</p>}
                  </div>
                </div>
              )}
            </div>

            {/* Pending Applicants for Creators (Right Column) */}
            {viewMode === 'created' && pendingApplicantCount > 0 && (
              <div className="w-full md:w-1/3 flex flex-col gap-4 mt-4 md:mt-0 border border-[#EAEAEA] dark:border-neutral-800 p-4 md:p-6 rounded-xl relative shadow-sm h-fit">
                <div className="flex justify-between items-center mb-2 border-b border-[#EAEAEA] dark:border-neutral-800 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="font-inter text-sm font-bold tracking-[0.1em] text-[#000] dark:text-white uppercase">Pending</span>
                  </div>
                  <div className="bg-[#E2AAAB] text-black px-2 py-0.5 rounded-xl text-xs font-bold">
                    {pendingApplicantCount}
                  </div>
                </div>
                
                <div className="flex max-h-[320px] flex-col gap-4 overflow-y-auto pr-1 custom-scrollbar [&:has(.profile-preview-trigger:hover)]:overflow-visible [&:has(.profile-preview-trigger:focus-within)]:overflow-visible">
                  {(detail?.pendingRequests || []).map((request) => {
                    const applicantInitials = request.user.username.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();
                    return (
                      <div key={request.requestId} className="flex flex-col gap-3 border-b border-[#EAEAEA] dark:border-neutral-800 pb-4 last:border-0 last:pb-0 shrink-0">
                        <UserProfileHoverCard
                          align="right"
                          user={{
                            name: request.user.username,
                            initials: applicantInitials,
                            avatar: request.user.avatar,
                            role: request.user.role,
                            email: request.user.email,
                            phoneNumber: request.user.phoneNumber,
                            birthDate: request.user.birthDate,
                            gender: request.user.gender,
                            occupation: request.user.occupation,
                            hometown: request.user.hometown,
                            description: request.user.description,
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <UserAvatar avatar={request.user.avatar} initials={applicantInitials} alt={request.user.username} className="h-10 w-10" fallbackClassName="rounded-lg bg-gray-200 text-xs text-gray-500 dark:bg-neutral-800" />
                            <div className="flex flex-col">
                              <span className="font-openSans text-sm font-bold text-[#2E0052] dark:text-white">
                                {request.user.username}
                              </span>
                              <span className="font-openSans text-[11px] text-[#4C4451] dark:text-gray-400">
                                {new Date(request.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </UserProfileHoverCard>
                        <div className="p-2 rounded-lg border border-[#F1F5F9] dark:border-neutral-800 bg-white dark:bg-neutral-900 text-[#4C4451] dark:text-gray-300 text-xs font-openSans italic line-clamp-3">
                          {request.content || ''}
                        </div>
                        {canEdit && (
                          <div className="flex gap-2">
                            <button disabled={saving || !detail?.permissions.canApprove} onClick={() => void mutate(() => approveJoinRequest(group.id, request.requestId))} className="flex-1 py-1.5 rounded-lg bg-[#86F2E4] hover:bg-[#6be4d4] text-black font-openSans font-bold text-xs transition-colors disabled:opacity-50">
                              Approve
                            </button>
                            <button disabled={saving || !detail?.permissions.canDeny} onClick={() => void mutate(() => denyJoinRequest(group.id, request.requestId))} className="flex-1 py-1.5 rounded-lg bg-[#F8EFE6] dark:bg-neutral-800 border border-black dark:border-white text-black dark:text-white hover:bg-gray-100 dark:hover:bg-neutral-700 font-openSans font-bold text-xs transition-colors disabled:opacity-50">
                              Deny
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
            {/* Dissolve Group Button for Creators */}
            {canEdit && detail?.permissions.canDissolve && (
              <div className="flex justify-end mt-4">
                <button disabled={saving} onClick={() => { setActionError(null); setShowDissolveConfirm(true); }} className="flex items-center gap-2 px-6 py-3 rounded-lg bg-[#BA1A1A] text-white font-inter text-sm font-medium hover:bg-red-800 transition-colors disabled:opacity-50">
                  <svg width="16" height="18" viewBox="0 0 16 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5.4 13.5L8 10.9L10.6 13.5L12 12.1L9.4 9.5L12 6.9L10.6 5.5L8 8.1L5.4 5.5L4 6.9L6.6 9.5L4 12.1L5.4 13.5ZM3 18C2.45 18 1.97917 17.8042 1.5875 17.4125C1.19583 17.0208 1 16.55 1 16V3H0V1H5V0H11V1H16V3H15V16C15 16.55 14.8042 17.0208 14.4125 17.4125C14.0208 17.8042 13.55 18 13 18H3ZM13 3H3V16H13V3ZM3 3V16V3Z" fill="currentColor"/>
                  </svg>
                  Dissolve Group
                </button>
              </div>
            )}

            {/* Footer Actions for Joined/Explore Modes */}
            {(viewMode === 'joined' && group.userApplicantStatus === 'pending' && group.participationType === 'request') && (
              <div className="flex justify-end pt-4 border-t border-[#EAEAEA] dark:border-neutral-800 mt-4">
                <Button variant="secondary" className="min-w-36 px-6 py-2.5" disabled={saving} onClick={() => { setActionError(null); setShowCancelRequestConfirm(true); }}>
                  Cancel Request
                </Button>
              </div>
            )}

            {(viewMode === 'joined' && group.userApplicantStatus === 'approved' && detail?.permissions.canLeave) && (
              <div className="flex justify-end pt-4 border-t border-[#EAEAEA] dark:border-neutral-800 mt-4">
                <Button variant="secondary" className="min-w-32 px-6 py-2.5" disabled={saving} onClick={() => { setActionError(null); setShowLeaveConfirm(true); }}>{t('study_group.leave_group')}</Button>
              </div>
            )}

          </div>
          {contentScrollbar.visible && (
            <span className={styles.studyGroupScrollRail} aria-hidden="true">
              <span className={styles.studyGroupScrollThumb} style={{ height: `${contentScrollbar.thumbHeight}px`, transform: `translateY(${contentScrollbar.thumbTop}px)` }} />
            </span>
          )}
        </div>

          {memberToRemove && typeof document !== 'undefined' && createPortal(
            <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#07111F]/55 p-5 backdrop-blur-sm animate-fade-in" role="presentation" onClick={(event) => event.stopPropagation()} onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) setMemberToRemove(null); }}>
              <div role="alertdialog" aria-modal="true" aria-labelledby="remove-member-title" aria-describedby="remove-member-description" className="w-full max-w-sm rounded-2xl border border-[#E7DED4] bg-[#FFFDF9] p-6 shadow-[0_24px_70px_rgba(7,17,31,0.28)] dark:border-neutral-700 dark:bg-neutral-900">
                <div className="flex items-center justify-between gap-4">
                  <h3 id="remove-member-title" className="font-manrope text-xl font-bold text-[#0B1C30] dark:text-white">{t('study_group.remove_member_title')}</h3>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FDE8E7] text-[#BA1A1A] dark:bg-red-950/60 dark:text-red-300">
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2m8.5-10a4 4 0 1 0-4 0M18 8l4 4m0-4-4 4" /></svg>
                  </div>
                </div>
                <p id="remove-member-description" className="mt-2 text-sm leading-6 text-[#675F58] dark:text-neutral-300">{t('study_group.remove_member_description').replace('{name}', memberToRemove.name)}</p>
                {actionError && <p role="alert" className="mt-3 text-sm text-red-700 dark:text-red-300">{actionError}</p>}
                <div className="mt-6 grid grid-cols-2 gap-3">
                  <Button variant="secondary" className="min-h-11 w-full px-4 py-2.5 text-center text-sm" disabled={saving} onClick={() => setMemberToRemove(null)}>{t('study_group.keep_member')}</Button>
                  <button disabled={saving} onClick={() => void removeMember()} className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-[#BA1A1A] px-4 py-2.5 text-center text-sm font-bold leading-5 text-white transition-colors hover:bg-[#941414] disabled:cursor-wait disabled:opacity-60">{saving ? t('study_group.removing_member') : t('study_group.confirm_remove_member')}</button>
                </div>
              </div>
            </div>, document.body
          )}

          {showDissolveConfirm && typeof document !== 'undefined' && createPortal(
            <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#07111F]/55 p-5 backdrop-blur-sm animate-fade-in" role="presentation" onClick={(event) => event.stopPropagation()} onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) setShowDissolveConfirm(false); }}>
              <div role="alertdialog" aria-modal="true" aria-labelledby="dissolve-title" aria-describedby="dissolve-description" className="w-full max-w-sm rounded-2xl border border-[#E7DED4] bg-[#FFFDF9] p-6 shadow-[0_24px_70px_rgba(7,17,31,0.28)] dark:border-neutral-700 dark:bg-neutral-900">
                <div className="flex items-center justify-between gap-4">
                  <h3 id="dissolve-title" className="font-manrope text-xl font-bold text-[#0B1C30] dark:text-white">{t('study_group.dissolve_title')}</h3>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FDE8E7] text-[#BA1A1A] dark:bg-red-950/60 dark:text-red-300">
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.3 3.8 2.6 17.2A2 2 0 0 0 4.3 20h15.4a2 2 0 0 0 1.7-2.8L13.7 3.8a2 2 0 0 0-3.4 0Z" /></svg>
                  </div>
                </div>
                <p id="dissolve-description" className="mt-2 text-sm leading-6 text-[#675F58] dark:text-neutral-300">{t('study_group.dissolve_confirm')}</p>
                {actionError && <p role="alert" className="mt-3 text-sm text-red-700 dark:text-red-300">{actionError}</p>}
                <div className="mt-6 grid grid-cols-2 gap-3">
                  <Button variant="secondary" className="min-h-11 w-full px-4 py-2.5 text-center text-sm" disabled={saving} onClick={() => setShowDissolveConfirm(false)}>{t('study_group.keep_group')}</Button>
                  <button disabled={saving} onClick={() => void dissolve()} className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-[#BA1A1A] px-4 py-2.5 text-center text-sm font-bold leading-5 text-white transition-colors hover:bg-[#941414] disabled:cursor-wait disabled:opacity-60">{saving ? t('study_group.dissolving') : t('study_group.dissolve_permanently')}</button>
                </div>
              </div>
            </div>, document.body
          )}

          {showLeaveConfirm && typeof document !== 'undefined' && createPortal(
            <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#07111F]/55 p-5 backdrop-blur-sm animate-fade-in" role="presentation" onClick={(event) => event.stopPropagation()} onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) setShowLeaveConfirm(false); }}>
              <div role="alertdialog" aria-modal="true" aria-labelledby="leave-title" aria-describedby="leave-description" className="w-full max-w-sm rounded-2xl border border-[#E7DED4] bg-[#FFFDF9] p-6 shadow-[0_24px_70px_rgba(7,17,31,0.28)] dark:border-neutral-700 dark:bg-neutral-900">
                <div className="flex items-center justify-between gap-4">
                  <h3 id="leave-title" className="font-manrope text-xl font-bold text-[#0B1C30] dark:text-white">{t('study_group.leave_confirm')}</h3>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FFF0D8] text-[#8A5A00] dark:bg-amber-950/60 dark:text-amber-300">
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M10 17l5-5-5-5m5 5H3m10-8h5a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-5" /></svg>
                  </div>
                </div>
                <p id="leave-description" className="mt-2 text-sm leading-6 text-[#675F58] dark:text-neutral-300">{t('study_group.leave_description')}</p>
                {actionError && <p role="alert" className="mt-3 text-sm text-red-700 dark:text-red-300">{actionError}</p>}
                <div className="mt-6 grid grid-cols-2 gap-3">
                  <Button variant="secondary" className="min-h-11 w-full px-4 py-2.5 text-center text-sm" disabled={saving} onClick={() => setShowLeaveConfirm(false)}>{t('study_group.stay_in_group')}</Button>
                  <button disabled={saving} onClick={() => void leave()} className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-[#0B1C30] px-4 py-2.5 text-center text-sm font-bold leading-5 text-white transition-colors hover:bg-[#20364E] disabled:cursor-wait disabled:opacity-60 dark:bg-white dark:text-[#0B1C30]">{saving ? t('study_group.leaving') : t('study_group.leave_group')}</button>
                </div>
              </div>
            </div>, document.body
          )}

          {showCancelRequestConfirm && typeof document !== 'undefined' && createPortal(
            <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#07111F]/55 p-5 backdrop-blur-sm animate-fade-in" role="presentation" onClick={(event) => event.stopPropagation()} onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) setShowCancelRequestConfirm(false); }}>
              <div role="alertdialog" aria-modal="true" aria-labelledby="cancel-request-title" aria-describedby="cancel-request-description" className="w-full max-w-sm rounded-2xl border border-[#E7DED4] bg-[#FFFDF9] p-6 shadow-[0_24px_70px_rgba(7,17,31,0.28)] dark:border-neutral-700 dark:bg-neutral-900">
                <div className="flex items-center justify-between gap-4">
                  <h3 id="cancel-request-title" className="font-manrope text-xl font-bold text-[#0B1C30] dark:text-white">{t('study_group.cancel_request_title')}</h3>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#E8F0FA] text-[#315D87] dark:bg-blue-950/60 dark:text-blue-300">
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6 6 18" /></svg>
                  </div>
                </div>
                <p id="cancel-request-description" className="mt-2 text-sm leading-6 text-[#675F58] dark:text-neutral-300">{t('study_group.cancel_request_description')}</p>
                {actionError && <p role="alert" className="mt-3 text-sm text-red-700 dark:text-red-300">{actionError}</p>}
                <div className="mt-6 grid grid-cols-2 gap-3">
                  <Button variant="secondary" className="min-h-11 w-full px-4 py-2.5 text-center text-sm" disabled={saving} onClick={() => setShowCancelRequestConfirm(false)}>{t('study_group.keep_request')}</Button>
                  <button disabled={saving} onClick={() => void cancelRequest()} className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-[#0B1C30] px-4 py-2.5 text-center text-sm font-bold leading-5 text-white transition-colors hover:bg-[#20364E] disabled:cursor-wait disabled:opacity-60 dark:bg-white dark:text-[#0B1C30]">{saving ? t('study_group.cancelling_request') : t('study_group.cancel_request')}</button>
                </div>
              </div>
            </div>, document.body
          )}

        </div>
      </div>
  );
}
