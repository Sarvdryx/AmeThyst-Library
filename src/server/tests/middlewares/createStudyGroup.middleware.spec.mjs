import { beforeEach, describe, expect, it, vi } from 'vitest';
import { validateCreateStudyGroup } from '../../src/middlewares/study-group.middlewares.mjs';

describe('Create Study Group Middleware', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {
      body: {
        availId: '12',
        startDate: '2099-08-01',
        title: '  Algorithm Study Group  ',
        description: '  Prepare for the final examination.  ',
        subject: '  Algorithms  ',
        requirements: [' Bring notes ', '', '  Discuss exercises  '],
      },
    };
    res = { status: vi.fn(), json: vi.fn() };
    res.status.mockReturnValue(res);
    res.json.mockReturnValue(res);
    next = vi.fn();
  });

  describe('Test 1 - Valid request normalization', { tags: '@SG_CREATE_VALIDATION' }, () => {
    it('[TC-MID-CSG-001] normalizes numeric availability and trims metadata before continuing', () => {
      validateCreateStudyGroup(req, res, next);

      expect(next).toHaveBeenCalledOnce();
      expect(req.body).toEqual({
        availId: 12,
        startDate: '2099-08-01',
        title: 'Algorithm Study Group',
        description: 'Prepare for the final examination.',
        subject: 'Algorithms',
        requirements: ['Bring notes', 'Discuss exercises'],
      });
      expect(res.status).not.toHaveBeenCalled();
    });

    it('[TC-MID-CSG-002] defaults omitted optional requirements to an empty array', () => {
      delete req.body.requirements;

      validateCreateStudyGroup(req, res, next);

      expect(next).toHaveBeenCalledOnce();
      expect(req.body.requirements).toEqual([]);
    });
  });

  describe('Test 2 - Invalid creation requests', { tags: '@SG_CREATE_VALIDATION' }, () => {
    it('[TC-MID-CSG-003] rejects unsupported fields and reports their names', () => {
      req.body.createdBy = 'another-user';

      validateCreateStudyGroup(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Unsupported request field.',
          details: { fields: ['createdBy'] },
        },
      });
      expect(next).not.toHaveBeenCalled();
    });

    it.each([0, -1, 1.5, 'not-a-number'])('[TC-MID-CSG-004] rejects invalid availId %s', (availId) => {
      req.body.availId = availId;

      validateCreateStudyGroup(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'availId must be a positive integer.' },
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('[TC-MID-CSG-005] rejects a date that does not use YYYY-MM-DD', () => {
      req.body.startDate = '01/08/2099';

      validateCreateStudyGroup(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'startDate must use YYYY-MM-DD.' },
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('[TC-MID-CSG-006] rejects more than five non-empty requirements after normalization', () => {
      req.body.requirements = ['1', '2', '3', '4', '5', '6'];

      validateCreateStudyGroup(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'requirements must contain at most five non-empty items.',
        },
      });
      expect(next).not.toHaveBeenCalled();
    });
  });
});
