import { vi, describe, it, expect, beforeEach } from 'vitest';
import { verifyEmail } from '../../src/services/auth.services.mjs';
import { createAuthSession } from '../../src/services/auth-session.services.mjs';
import { setAuthCookies } from '../../src/utils/authHelpers.mjs';
import { verifyEmailHandler } from '../../src/controllers/auth.controllers.mjs';

vi.mock('../../src/services/auth.services.mjs', () => ({
  verifyEmail: vi.fn(),
  registerUser: vi.fn(),
  loginUser: vi.fn(),
  resendVerificationEmailService: vi.fn(),
}));

vi.mock('../../src/services/auth-session.services.mjs', () => ({
  createAuthSession: vi.fn(),
  revokeRefreshToken: vi.fn(),
  rotateAuthSession: vi.fn(),
}));

vi.mock('../../src/utils/authHelpers.mjs', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    setAuthCookies: vi.fn(),
  };
});

vi.mock('../../src/services/recommendation.services.mjs', () => ({
  getUserRecommendations: vi.fn().mockResolvedValue(undefined),
}));

describe('Verify Email Controller', () => {
  let req;
  let res;

  const sessionUser = {
    userId: 5,
    email: 'student@example.com',
    username: 'student',
    avatar: null,
    role: 'user',
    branch_id: null,
    must_change_password: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    req = {
      body: {
        token: 'test-token-uuid-123',
      },
    };

    res = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
  });

  describe('Successful session mapping', { tags: ['@A_R1', '@A_R7', '@A_R10'] }, () => {
    it('[TC-CTL-VE-001] should create a session, set cookies, and return 200 with the session user', async () => {
      const userRow = { user_id: 5, email: 'student@example.com', username: 'student', role: 'user' };
      verifyEmail.mockResolvedValue({
        user: sessionUser,
        userRow,
      });
      const session = {
        accessToken: 'access',
        refreshToken: 'refresh',
        csrfToken: 'csrf',
        user: sessionUser,
      };
      createAuthSession.mockResolvedValue(session);

      await verifyEmailHandler(req, res);

      expect(verifyEmail).toHaveBeenCalledWith({ token: 'test-token-uuid-123' });
      expect(createAuthSession).toHaveBeenCalledWith(userRow, req);
      expect(setAuthCookies).toHaveBeenCalledWith(res, session);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ user: sessionUser });
      expect(res.json.mock.calls[0][0]).not.toHaveProperty('token');
    });
  });

  describe('Token and lifecycle mapping', { tags: ['@A_R3', '@A_R10'] }, () => {
    it('[TC-CTL-VE-002] should return 400 when the token is missing and 410 when the link has expired', async () => {
      req.body.token = undefined;
      await verifyEmailHandler(req, res);
      expect(verifyEmail).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Verification token is required' });

      vi.clearAllMocks();
      req.body.token = 'test-token-uuid-123';
      verifyEmail.mockRejectedValue(new Error('Verification link has expired. Please register again.'));

      await verifyEmailHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(410);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Verification link has expired. Please register again.',
      });
    });
  });

});
