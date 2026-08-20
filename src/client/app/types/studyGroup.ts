export type StudyGroupStatus = 'upcoming' | 'full' | 'inprogress' | 'completed' | 'cancelled' | 'expired';
export type ParticipationStatus = 'pending' | 'approved' | 'denied' | 'expired';

export interface PageMeta { page: number; pageSize: number; totalItems: number; totalPages: number }
export interface UserSummary {
  userId: string;
  username: string;
  avatar: string | null;
  role?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  birthDate?: string | null;
  gender?: string | null;
  occupation?: string | null;
  hometown?: string | null;
  description?: string | null;
}
export interface RoomSummary { roomId: number; roomName: string; branchId: number; branchName: string; capacity: number; imageUrl: string | null }
export interface ReservationSummary { reserveId: string; startDate: string; startTime: string; endTime: string; status: 'pending' | 'reserved' | 'used' | 'cancelled'; room: RoomSummary }
export interface Participation { requestId: string; groupId: string; user: UserSummary; content: string | null; type: 'request' | 'invite'; status: ParticipationStatus; createdAt: string; decidedAt: string | null }
export interface StudyGroupPermissions { canEdit: boolean; canApprove: boolean; canDeny: boolean; canRemove: boolean; canDissolve: boolean; canLeave: boolean; canCancelRequest: boolean }
export interface StudyGroupSummary { groupId: string; subject: string; title: string; description: string; requirements: string[]; host: UserSummary; reservation: ReservationSummary; capacity: number; currentMembers: number; status: StudyGroupStatus; pendingCount: number; isHost: boolean; currentUserParticipation: Participation | null; canJoin: boolean; retryAt: string | null; createdAt: string; updatedAt: string }
export interface StudyGroupDetail extends StudyGroupSummary { organizerProfile: UserSummary; approvedMembers: Participation[]; pendingRequests: Participation[]; permissions: StudyGroupPermissions }
export interface DissolveStudyGroupResult { groupId: string; deleted: true }
export interface JoinedStudyGroup { group: StudyGroupSummary; participation: Participation }
export interface StudyGroupNotificationActor { userId: string | null; username: string; email: string | null; avatar: string | null }
export interface StudyGroupInvitation { requestId: string; content: string | null; invitedAt: string; actor?: StudyGroupNotificationActor; group: StudyGroupSummary }
export interface StudyGroupLifecycleNotification {
  id: string;
  type:
    | 'join_request_submitted'
    | 'join_request_cancelled'
    | 'join_request_approved'
    | 'join_request_denied'
    | 'member_joined'
    | 'invitation_declined'
    | 'group_updated'
    | 'member_removed'
    | 'member_left'
    | 'group_dissolved';
  groupId: string;
  createdAt: string;
  read?: boolean;
  memberName?: string;
  changedFields?: string[];
  actor?: StudyGroupNotificationActor;
  destination?: {
    mode: 'created' | 'joined' | 'dashboard';
    groupId?: string;
  };
  group: {
    title: string;
    subject: string;
    currentMembers?: number;
    capacity?: number;
    date: string;
    startTime: string;
    endTime: string;
    roomName: string;
    branchName: string;
    roomId: number;
    branchId: number;
  };
}
export interface CreateStudyGroupInput { availId: number; startDate: string; title: string; description: string; subject: string; requirements: string[] }
export type UpdateStudyGroupInput = Partial<Pick<CreateStudyGroupInput, 'title' | 'description' | 'subject' | 'requirements'>>;
export interface StudyGroupQuery { page?: number; pageSize?: number; search?: string; subject?: string; date?: string; startTime?: string; endTime?: string; branchIds?: string; roomIds?: string; sort?: 'newest' | 'availability' }
export interface InviteStudyGroupMemberInput { email: string; message?: string }
export interface StudyGroupFilterRoom { roomId: number; roomName: string; capacity: number }
export interface StudyGroupFilterBranch { branchId: number; branchName: string; rooms: StudyGroupFilterRoom[] }
export type AsyncResult<T> = { success: true; data: T } | { success: false; error: { code: string; message: string; details?: any } };
export interface PageState<T> { data: T[]; meta: PageMeta; isLoading: boolean; error: string | null; filters: StudyGroupQuery; }
