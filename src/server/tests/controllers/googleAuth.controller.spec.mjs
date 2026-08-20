import { vi, describe, it, expect, beforeEach } from 'vitest';
import { createAuthSession } from '../../src/services/auth-session.services.mjs';
import { setAuthCookies } from '../../src/utils/authHelpers.mjs';
import { googleCallback } from '../../src/controllers/auth.controllers.mjs';

vi.mock('../../src/config/passport.mjs', () => ({
  default: {
    authenticate: vi.fn((_strategy, _options, callback) => async (req) => {
      await callback(null, req.user, undefined);
    }),
  },
  googleVerifyCallback: vi.fn(),
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

describe('Google Auth Controller', () => {
  let req;
  let res;
  let next;

  const sessionUser = {
    userId: 101,
    email: 'google@example.com',
    username: 'google_user',
    avatar: 'https://avatar.com/pic.jpg',
    role: 'user',
    branch_id: null,
    must_change_password: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    req = {
      user: {
        user_id: 101,
        email: 'google@example.com',
        username: 'google_user',
        avatar: 'https://avatar.com/pic.jpg',
        password_hash: 'GOOGLE_AUTH',
        role: 'user',
      },
    };

    res = {
      redirect: vi.fn(),
    };
    next = vi.fn();

    createAuthSession.mockResolvedValue({
      accessToken: 'access',
      refreshToken: 'refresh',
      csrfToken: 'csrf',
      user: sessionUser,
    });
  });

  describe('Successful redirect mapping', { tags: ['@A_R5', '@A_R6', '@A_R10'] }, () => {
    it('[TC-CTL-GA-001] should create a session, set cookies, and redirect without a query token', async () => {
      const handler = googleCallback[0];
      const session = {
        accessToken: 'access',
        refreshToken: 'refresh',
        csrfToken: 'csrf',
        user: sessionUser,
      };
      createAuthSession.mockResolvedValue(session);

      await handler(req, res, next);

      expect(createAuthSession).toHaveBeenCalledWith(req.user, req);
      expect(setAuthCookies).toHaveBeenCalledWith(res, session);
      expect(res.redirect).toHaveBeenCalledWith(`${process.env.CLIENT_URL}/auth/callback`);
      expect(res.redirect.mock.calls[0][0]).not.toContain('token=');
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('Security invariants', { tags: ['@A_R7'] }, () => {
    it('[TC-CTL-GA-002] should never leak password_hash in the redirect URL', async () => {
      const handler = googleCallback[0];

      await handler(req, res, next);

      const redirectUrl = res.redirect.mock.calls[0][0];
      expect(redirectUrl).not.toContain('GOOGLE_AUTH');
      expect(redirectUrl).not.toContain('password_hash');
    });
  });
});
