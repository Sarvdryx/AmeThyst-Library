import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as model from '../../src/models/study-group.models.mjs';
import {
  createStudyGroup,
  normalizeMetadata,
  normalizeRequirements,
} from '../../src/services/study-group.services.mjs';

vi.mock('../../src/models/study-group.models.mjs', () => ({
  withTransaction: vi.fn(),
  findSlotForCreation: vi.fn(),
  insertReservation: vi.fn(),
  insertStudyGroup: vi.fn(),
  findGroupDetail: vi.fn(),
}));

vi.mock('../../src/utils/mailer.mjs', () => ({
  sendStudyGroupDissolvedEmail: vi.fn(),
  sendStudyGroupInvitationEmail: vi.fn(),
  sendStudyGroupMemberJoinedEmail: vi.fn(),
  sendStudyGroupMemberLeftEmail: vi.fn(),
  sendStudyGroupRemovalEmail: vi.fn(),
  sendStudyGroupRequestApprovedEmail: vi.fn(),
  sendStudyGroupRequestDeniedEmail: vi.fn(),
  sendStudyGroupRequestSubmittedEmail: vi.fn(),
}));

const client = { name: 'create-study-group-unit-client' };
const hostId = 'host-1';
const groupId = 'group-1';

const validInput = (overrides = {}) => ({
  availId: 12,
  startDate: '2099-08-01',
  title: 'Algorithm Study Group',
  description: 'Prepare for the final examination.',
  subject: 'Algorithms',
  requirements: ['Bring notes'],
  ...overrides,
});

const detailRecord = () => ({
  summary: {
    groupId,
    subject: 'Algorithms',
    title: 'Algorithm Study Group',
    description: 'Prepare for the final examination.',
    requirements: ['Bring notes'],
    hostUserId: hostId,
    hostUsername: 'Host User',
    hostAvatar: null,
    hostRole: 'user',
    reserveId: 'reserve-1',
    startDate: '2099-08-01',
    startTime: '09:00:00',
    endTime: '10:00:00',
    reservationStatus: 'reserved',
    roomId: 'room-1',
    roomName: 'Room 101',
    branchId: 'branch-1',
    branchName: 'Central Library',
    roomCapacity: 4,
    capacity: 4,
    currentMembers: 1,
    status: 'upcoming',
    pendingCount: 0,
    createdAt: '2099-07-01T00:00:00.000Z',
    updatedAt: '2099-07-01T00:00:00.000Z',
  },
  organizer: {
    userId: hostId,
    username: 'Host User',
    email: 'host@example.com',
    role: 'user',
  },
  requests: [],
});

describe('Create Study Group Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    model.withTransaction.mockImplementation(async (work) => work(client));
    model.findSlotForCreation.mockResolvedValue({ capacity: 4, occupied: false });
    model.insertReservation.mockResolvedValue({ reserveId: 'reserve-1' });
    model.insertStudyGroup.mockResolvedValue({ groupId });
    model.findGroupDetail.mockResolvedValue(detailRecord());
  });

  describe('Test 1 - Metadata normalization helpers', { tags: '@SG_CREATE_NORMALIZATION' }, () => {
    it('[TC-SRV-CSG-001] trims metadata and removes empty requirements', () => {
      expect(normalizeMetadata({
        title: '  Algorithms  ',
        description: '  Exam preparation  ',
        subject: '  Computer Science  ',
        requirements: [' Notes ', ' ', 'Laptop'],
      })).toEqual({
        title: 'Algorithms',
        description: 'Exam preparation',
        subject: 'Computer Science',
        requirements: ['Notes', 'Laptop'],
      });
    });

    it('[TC-SRV-CSG-002] coerces requirement values to strings before trimming', () => {
      expect(normalizeRequirements([1, true, null, '  notes  ']))
        .toEqual(['1', 'true', 'null', 'notes']);
    });
  });

  describe('Test 2 - Authentication and input validation', { tags: '@SG_CREATE_VALIDATION' }, () => {
    it('[TC-SRV-CSG-003] rejects an unauthenticated caller before opening a transaction', async () => {
      await expect(createStudyGroup(null, validInput()))
        .rejects.toMatchObject({ code: 'UNAUTHORIZED', status: 401 });

      expect(model.withTransaction).not.toHaveBeenCalled();
    });

    it.each([
      ['title', '   '],
      ['title', '12345'],
      ['description', '   '],
      ['subject', '---'],
    ])('[TC-SRV-CSG-004] rejects invalid %s metadata before opening a transaction', async (field, value) => {
      await expect(createStudyGroup(hostId, validInput({ [field]: value })))
        .rejects.toMatchObject({ code: 'VALIDATION_ERROR', status: 400 });

      expect(model.withTransaction).not.toHaveBeenCalled();
    });

    it('[TC-SRV-CSG-005] rejects more than five normalized requirements before opening a transaction', async () => {
      await expect(createStudyGroup(hostId, validInput({
        requirements: ['1', '2', '3', '4', '5', '6'],
      }))).rejects.toMatchObject({ code: 'VALIDATION_ERROR', status: 400 });

      expect(model.withTransaction).not.toHaveBeenCalled();
    });
  });

  describe('Test 3 - Authoritative slot validation', { tags: '@SG_CREATE_SLOT' }, () => {
    it('[TC-SRV-CSG-006] rejects a missing slot without inserting a reservation or group', async () => {
      model.findSlotForCreation.mockResolvedValue(null);

      await expect(createStudyGroup(hostId, validInput()))
        .rejects.toMatchObject({ code: 'NOT_FOUND', status: 404 });

      expect(model.findSlotForCreation).toHaveBeenCalledWith(12, '2099-08-01', client);
      expect(model.insertReservation).not.toHaveBeenCalled();
      expect(model.insertStudyGroup).not.toHaveBeenCalled();
    });

    it('[TC-SRV-CSG-007] rejects a room with no host capacity without writing data', async () => {
      model.findSlotForCreation.mockResolvedValue({ capacity: 0, occupied: false });

      await expect(createStudyGroup(hostId, validInput()))
        .rejects.toMatchObject({ code: 'INVALID_CAPACITY', status: 409 });

      expect(model.insertReservation).not.toHaveBeenCalled();
      expect(model.insertStudyGroup).not.toHaveBeenCalled();
    });

    it('[TC-SRV-CSG-008] rejects an already-booked slot before inserting a reservation', async () => {
      model.findSlotForCreation.mockResolvedValue({ capacity: 4, occupied: true });

      await expect(createStudyGroup(hostId, validInput()))
        .rejects.toMatchObject({ code: 'SLOT_UNAVAILABLE', status: 409 });

      expect(model.findSlotForCreation).toHaveBeenCalledWith(12, '2099-08-01', client);
      expect(model.insertReservation).not.toHaveBeenCalled();
      expect(model.insertStudyGroup).not.toHaveBeenCalled();
    });
  });

  describe('Test 4 - Atomic creation orchestration', { tags: '@SG_CREATE_ATOMIC' }, () => {
    it('[TC-SRV-CSG-009] creates reservation then group and returns the projected detail in one transaction', async () => {
      const result = await createStudyGroup(hostId, validInput({
        title: '  Algorithm Study Group  ',
        description: '  Prepare for the final examination.  ',
        subject: '  Algorithms  ',
        requirements: [' Bring notes ', ' '],
      }));

      expect(model.withTransaction).toHaveBeenCalledOnce();
      expect(model.insertReservation).toHaveBeenCalledWith({
        userId: hostId,
        availId: 12,
        startDate: '2099-08-01',
      }, client);
      expect(model.insertStudyGroup).toHaveBeenCalledWith({
        userId: hostId,
        reserveId: 'reserve-1',
        title: 'Algorithm Study Group',
        description: 'Prepare for the final examination.',
        subject: 'Algorithms',
        requirements: ['Bring notes'],
        capacity: 4,
      }, client);
      expect(model.findGroupDetail).toHaveBeenCalledWith(groupId, hostId, client);
      expect(model.insertReservation.mock.invocationCallOrder[0])
        .toBeLessThan(model.insertStudyGroup.mock.invocationCallOrder[0]);
      expect(model.insertStudyGroup.mock.invocationCallOrder[0])
        .toBeLessThan(model.findGroupDetail.mock.invocationCallOrder[0]);
      expect(result).toMatchObject({
        groupId,
        title: 'Algorithm Study Group',
        isHost: true,
        currentMembers: 1,
      });
    });
  });

  describe('Test 5 - Persistence error mapping', { tags: '@SG_CREATE_ERRORS' }, () => {
    it('[TC-SRV-CSG-010] maps an active-slot uniqueness race to SLOT_UNAVAILABLE', async () => {
      model.insertReservation.mockRejectedValue({ code: '23505' });

      await expect(createStudyGroup(hostId, validInput()))
        .rejects.toMatchObject({ code: 'SLOT_UNAVAILABLE', status: 409 });
    });

    it('[TC-SRV-CSG-011] maps a missing authenticated user foreign key to AUTH_USER_NOT_FOUND', async () => {
      model.insertReservation.mockRejectedValue({
        code: '23503',
        constraint: 'fk_reserve_user',
      });

      await expect(createStudyGroup(hostId, validInput()))
        .rejects.toMatchObject({ code: 'AUTH_USER_NOT_FOUND', status: 401 });
    });

    it('[TC-SRV-CSG-012] preserves unexpected persistence errors for the controller boundary', async () => {
      const error = new Error('Connection lost');
      model.insertReservation.mockRejectedValue(error);

      await expect(createStudyGroup(hostId, validInput())).rejects.toBe(error);
    });
  });
});
