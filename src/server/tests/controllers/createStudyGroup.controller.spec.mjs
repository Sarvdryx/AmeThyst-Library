import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createStudyGroup } from '../../src/services/study-group.services.mjs';
import { emitStudyGroupChanged } from '../../src/config/socket.mjs';
import { createStudyGroupController } from '../../src/controllers/study-group.controllers.mjs';

vi.mock('../../src/services/study-group.services.mjs', () => ({
  createStudyGroup: vi.fn(),
}));

vi.mock('../../src/config/socket.mjs', () => ({
  emitStudyGroupChanged: vi.fn(),
  emitUserNotification: vi.fn(),
}));

describe('Create Study Group Controller', () => {
  let req;
  let res;

  beforeEach(() => {
    vi.clearAllMocks();
    req = {
      user: { userId: 'host-1' },
      body: {
        availId: 12,
        startDate: '2099-08-01',
        title: 'Algorithm Study Group',
        description: 'Prepare for the final examination.',
        subject: 'Algorithms',
        requirements: ['Bring notes'],
      },
    };
    res = {
      status: vi.fn(),
      json: vi.fn(),
    };
    res.status.mockReturnValue(res);
    res.json.mockReturnValue(res);
  });

  describe('Test 1 - Successful creation response', { tags: '@SG_CREATE_CONTROLLER' }, () => {
    it('[TC-CTL-CSG-001] delegates the authenticated user and normalized request body to the service', async () => {
      const detail = { groupId: 'group-1', title: 'Algorithm Study Group' };
      createStudyGroup.mockResolvedValue(detail);

      await createStudyGroupController(req, res);

      expect(createStudyGroup).toHaveBeenCalledOnce();
      expect(createStudyGroup).toHaveBeenCalledWith('host-1', req.body);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: detail });
    });

    it('[TC-CTL-CSG-002] emits the created event only after the service succeeds', async () => {
      createStudyGroup.mockResolvedValue({ groupId: 'group-1' });

      await createStudyGroupController(req, res);

      expect(emitStudyGroupChanged).toHaveBeenCalledWith('group-1', 'created');
      expect(createStudyGroup.mock.invocationCallOrder[0])
        .toBeLessThan(emitStudyGroupChanged.mock.invocationCallOrder[0]);
    });
  });

  describe('Test 2 - Structured creation errors', { tags: '@SG_CREATE_CONTROLLER' }, () => {
    it('[TC-CTL-CSG-003] maps a Study Group error to its status and complete error envelope', async () => {
      createStudyGroup.mockRejectedValue({
        code: 'VALIDATION_ERROR',
        message: 'Invalid Study Group data.',
        status: 400,
        details: { fields: ['title'] },
        retryAt: '2099-08-01T02:00:00.000Z',
      });

      await createStudyGroupController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid Study Group data.',
          details: { fields: ['title'] },
          retryAt: '2099-08-01T02:00:00.000Z',
        },
      });
      expect(emitStudyGroupChanged).not.toHaveBeenCalled();
    });

    it('[TC-CTL-CSG-004] maps an unexpected failure to a safe 500 response without emitting an event', async () => {
      createStudyGroup.mockRejectedValue(new Error('Database unavailable'));

      await createStudyGroupController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Database unavailable' },
      });
      expect(emitStudyGroupChanged).not.toHaveBeenCalled();
    });
  });
});
