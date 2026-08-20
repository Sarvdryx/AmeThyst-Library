import { beforeEach, describe, expect, it, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import pool from '../../src/config/postgres.mjs';
import { createStudyGroup } from '../../src/services/study-group.services.mjs';
import { emitStudyGroupChanged } from '../../src/config/socket.mjs';
import studyGroupRoutes from '../../src/routes/study-group.routes.mjs';
import { JWT_AUDIENCE, JWT_ISSUER } from '../../src/utils/authHelpers.mjs';

vi.mock('jsonwebtoken', () => ({
  default: { verify: vi.fn() },
}));

vi.mock('../../src/config/postgres.mjs', () => ({
  default: {
    query: vi.fn(),
    connect: vi.fn(),
    on: vi.fn(),
  },
}));

vi.mock('../../src/services/study-group.services.mjs', () => ({
  createStudyGroup: vi.fn(),
}));

vi.mock('../../src/config/socket.mjs', () => ({
  emitStudyGroupChanged: vi.fn(),
  emitUserNotification: vi.fn(),
}));

const app = express();
app.use(express.json());
app.use('/api/study-groups', studyGroupRoutes);

const validPayload = (overrides = {}) => ({
  availId: 12,
  startDate: '2099-08-01',
  title: '  Algorithm Study Group  ',
  description: '  Prepare for the final examination.  ',
  subject: '  Algorithms  ',
  requirements: [' Bring notes ', ' ', 'Discuss exercises'],
  ...overrides,
});

const authenticatedUser = (overrides = {}) => ({
  user_id: 'host-1',
  email: 'host@example.com',
  role: 'user',
  branch_id: null,
  ...overrides,
});

const postCreate = (payload = validPayload(), token = 'valid-token') => {
  const call = request(app).post('/api/study-groups').send(payload);
  return token ? call.set('Authorization', `Bearer ${token}`) : call;
};

describe('Create Study Group API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    jwt.verify.mockReturnValue({ userId: 'token-user-id' });
    pool.query.mockResolvedValue({ rows: [authenticatedUser()] });
    createStudyGroup.mockResolvedValue({
      groupId: 'group-1',
      title: 'Algorithm Study Group',
      subject: 'Algorithms',
      requirements: ['Bring notes', 'Discuss exercises'],
      currentMembers: 1,
      capacity: 4,
      isHost: true,
    });
  });

  describe('Test 1 - Successful API creation', { tags: '@SG_CREATE_API' }, () => {
    it('[TC-INT-CSG-001] returns 201 after the complete route pipeline normalizes and creates a group', async () => {
      const response = await postCreate();

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        success: true,
        data: {
          groupId: 'group-1',
          title: 'Algorithm Study Group',
          subject: 'Algorithms',
          requirements: ['Bring notes', 'Discuss exercises'],
          currentMembers: 1,
          capacity: 4,
          isHost: true,
        },
      });
      expect(jwt.verify).toHaveBeenCalledWith('valid-token', process.env.JWT_SECRET, {
        algorithms: ['HS256'],
        issuer: JWT_ISSUER,
        audience: JWT_AUDIENCE,
      });
      expect(pool.query).toHaveBeenCalledWith(
        'SELECT user_id, email, username, avatar, role, branch_id, status, token_version, must_change_password FROM public.users WHERE user_id = $1',
        ['token-user-id'],
      );
      expect(createStudyGroup).toHaveBeenCalledWith('host-1', {
        availId: 12,
        startDate: '2099-08-01',
        title: 'Algorithm Study Group',
        description: 'Prepare for the final examination.',
        subject: 'Algorithms',
        requirements: ['Bring notes', 'Discuss exercises'],
      });
      expect(emitStudyGroupChanged).toHaveBeenCalledWith('group-1', 'created');
    });
  });

  describe('Test 2 - Authentication and role guards', { tags: '@SG_CREATE_API' }, () => {
    it('[TC-INT-CSG-002] returns 401 when the bearer token is missing', async () => {
      const response = await postCreate(validPayload(), null);

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        success: false,
        error: { code: 'AUTH_REQUIRED', message: 'No token provided.' },
      });
      expect(createStudyGroup).not.toHaveBeenCalled();
    });

    it('[TC-INT-CSG-003] returns 401 when the token is invalid', async () => {
      const tokenError = new Error('invalid signature');
      tokenError.name = 'JsonWebTokenError';
      jwt.verify.mockImplementation(() => { throw tokenError; });

      const response = await postCreate();

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        success: false,
        error: { code: 'INVALID_TOKEN', message: 'Invalid token.' },
      });
      expect(pool.query).not.toHaveBeenCalled();
      expect(createStudyGroup).not.toHaveBeenCalled();
    });

    it.each(['admin', 'librarian'])('[TC-INT-CSG-004] returns 403 for the non-student role %s', async (role) => {
      pool.query.mockResolvedValue({ rows: [authenticatedUser({ role })] });

      const response = await postCreate();

      expect(response.status).toBe(403);
      expect(response.body).toEqual({ error: 'Forbidden: insufficient permissions' });
      expect(createStudyGroup).not.toHaveBeenCalled();
    });
  });

  describe('Test 3 - Request validation', { tags: '@SG_CREATE_API' }, () => {
    it('[TC-INT-CSG-005] returns a structured 400 response for an unsupported field', async () => {
      const response = await postCreate(validPayload({ createdBy: 'another-user' }));

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Unsupported request field.',
          details: { fields: ['createdBy'] },
        },
      });
      expect(createStudyGroup).not.toHaveBeenCalled();
    });

    it('[TC-INT-CSG-006] returns a structured 400 response for invalid creation metadata', async () => {
      const response = await postCreate(validPayload({ title: '12345' }));

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'title must contain at least one letter.',
        },
      });
      expect(createStudyGroup).not.toHaveBeenCalled();
    });
  });

  describe('Test 4 - Service outcome mapping', { tags: '@SG_CREATE_API' }, () => {
    it.each([
      ['NOT_FOUND', 'Room availability slot not found.', 404],
      ['SLOT_UNAVAILABLE', 'This room slot is no longer available.', 409],
      ['INVALID_CAPACITY', 'The selected room cannot host a Study Group.', 409],
    ])('[TC-INT-CSG-007] returns %s as an HTTP %i response', async (code, message, status) => {
      createStudyGroup.mockRejectedValue({ code, message, status });

      const response = await postCreate();

      expect(response.status).toBe(status);
      expect(response.body).toEqual({
        success: false,
        error: { code, message },
      });
      expect(emitStudyGroupChanged).not.toHaveBeenCalled();
    });

    it('[TC-INT-CSG-008] returns a safe 500 envelope and emits no event for unexpected failures', async () => {
      createStudyGroup.mockRejectedValue(new Error('Database unavailable'));

      const response = await postCreate();

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Database unavailable' },
      });
      expect(emitStudyGroupChanged).not.toHaveBeenCalled();
    });
  });
});
