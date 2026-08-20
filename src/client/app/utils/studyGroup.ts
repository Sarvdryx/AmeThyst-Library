import { apiFetch, type ApiResult } from './apiClient';
import type { CreateStudyGroupInput, DissolveStudyGroupResult, InviteStudyGroupMemberInput, JoinedStudyGroup, PageMeta, StudyGroupDetail, StudyGroupFilterBranch, StudyGroupInvitation, StudyGroupQuery, StudyGroupSummary, UpdateStudyGroupInput } from '../types/studyGroup';
import type { StudyGroup } from '../study-together/mockData';
import { localizedBranchName, localizedRoomName } from './room';
import { displayDate } from './notificationFormat';

export type PageResult<T> = ApiResult<T[]> & { meta?: PageMeta };

const queryString = (query: StudyGroupQuery = {}) => {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== '') params.set(key, String(value));
  });
  const encoded = params.toString();
  return encoded ? `?${encoded}` : '';
};

export const createStudyGroup = (input: CreateStudyGroupInput) => apiFetch<StudyGroupDetail>('/api/study-groups', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
export const listStudyGroups = (query?: StudyGroupQuery) => apiFetch<StudyGroupSummary[]>(`/api/study-groups${queryString(query)}`) as Promise<PageResult<StudyGroupSummary>>;
export const listStudyGroupFilterOptions = () => apiFetch<StudyGroupFilterBranch[]>('/api/rooms/study-group-filter-options');
export const listCreatedStudyGroups = (query?: StudyGroupQuery) => apiFetch<StudyGroupSummary[]>(`/api/study-groups/created${queryString(query)}`) as Promise<PageResult<StudyGroupSummary>>;
export const listJoinedStudyGroups = (query?: StudyGroupQuery) => apiFetch<JoinedStudyGroup[]>(`/api/study-groups/joined${queryString(query)}`) as Promise<PageResult<JoinedStudyGroup>>;
export const getStudyGroup = (groupId: string) => apiFetch<StudyGroupDetail>(`/api/study-groups/${groupId}`);
export const updateStudyGroup = (groupId: string, input: UpdateStudyGroupInput) => apiFetch<StudyGroupDetail>(`/api/study-groups/${groupId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
export const requestToJoin = (groupId: string, content?: string) => apiFetch(`/api/study-groups/${groupId}/requests`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content }) });
export const approveJoinRequest = (groupId: string, requestId: string) => apiFetch(`/api/study-groups/${groupId}/requests/${requestId}/approve`, { method: 'POST' });
export const denyJoinRequest = (groupId: string, requestId: string) => apiFetch(`/api/study-groups/${groupId}/requests/${requestId}/deny`, { method: 'POST' });
export const cancelJoinRequest = (groupId: string, requestId: string) => apiFetch(`/api/study-groups/${groupId}/requests/${requestId}`, { method: 'DELETE' });
export const removeStudyGroupMember = (groupId: string, userId: string) => apiFetch(`/api/study-groups/${groupId}/members/${userId}`, { method: 'DELETE' });
export const leaveStudyGroup = (groupId: string) => apiFetch(`/api/study-groups/${groupId}/membership`, { method: 'DELETE' });
export const dissolveStudyGroup = (groupId: string) => apiFetch<DissolveStudyGroupResult>(`/api/study-groups/${groupId}/dissolve`, { method: 'POST' });
export const inviteStudyGroupMember = (groupId: string, input: InviteStudyGroupMemberInput) => apiFetch(`/api/study-groups/${groupId}/invitations`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
export const listStudyGroupInvitations = () => apiFetch<StudyGroupInvitation[]>('/api/study-groups/invitations');
export const acceptStudyGroupInvitation = (groupId: string, requestId: string) => apiFetch(`/api/study-groups/${groupId}/invitations/${requestId}/accept`, { method: 'POST' });
export const denyStudyGroupInvitation = (groupId: string, requestId: string) => apiFetch(`/api/study-groups/${groupId}/invitations/${requestId}/deny`, { method: 'POST' });

export const initials = (name: string) => name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase();
const displayTime = (value: string) => String(value).slice(0, 5);

export const toLegacyStudyGroup = (group: StudyGroupSummary, participationStatus?: StudyGroup['userApplicantStatus'], translate?: (key: string) => string): StudyGroup => ({
  id: group.groupId,
  subject: group.subject,
  title: group.title,
  description: group.description,
  leader: {
    name: group.host.username,
    initials: initials(group.host.username),
    avatar: group.host.avatar,
    role: group.host.role,
    occupation: group.host.occupation,
    hometown: group.host.hometown,
    description: group.host.description,
  },
  time: `${displayDate(group.reservation.startDate)}\n${displayTime(group.reservation.startTime)} - ${displayTime(group.reservation.endTime)}`,
  address: translate ? localizedBranchName(translate, group.reservation.room.branchId, group.reservation.room.branchName) : group.reservation.room.branchName,
  room: translate ? localizedRoomName(translate, group.reservation.room.roomId, group.reservation.room.roomName) : group.reservation.room.roomName,
  currentMembers: group.currentMembers,
  maxMembers: group.capacity,
  status: group.status === 'full' ? 'Full' : 'Available',
  requirements: group.requirements,
  userStatus: group.status,
  userApplicantStatus: participationStatus || group.currentUserParticipation?.status,
  participationType: group.currentUserParticipation?.type,
  participationRequestId: group.currentUserParticipation?.requestId,
  pendingApplicants: group.pendingCount,
  canJoin: group.canJoin,
  retryAt: group.retryAt,
  isCreator: group.isHost,
});
