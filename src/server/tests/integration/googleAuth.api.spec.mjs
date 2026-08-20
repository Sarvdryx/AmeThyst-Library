import { vi, describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { createAuthSession } from '../../src/services/auth-session.services.mjs';
import authRoutes from '../../src/routes/auth.routes.mjs';

vi.mock('../../src/config/passport.mjs', () => {
  return {
    default: {
      authenticate: vi.fn((strategy, options, callback) => {
        return async (req, res, next) => {
          if (callback) {
            const user = {
              user_id: 101,
              email: 'google-api@example.com',
              username: 'google_api_user',
              avatar: 'https://avatar.com/pic.jpg',
              role: 'user',
            };
            return callback(null, user, undefined);
          }
          if (options && options.failureRedirect) {
            if (req.query.fail === 'true') {
              return res.redirect(options.failureRedirect);
            }
            req.user = {
              user_id: 101,
              email: 'google-api@example.com',
              username: 'google_api_user',
              avatar: 'https://avatar.com/pic.jpg',
              role: 'user',
            };
            next();
          } else {
            res.redirect('https://accounts.google.com/o/oauth2/v2/auth?scope=profile+email');
          }
        };
      }),
    },
    googleVerifyCallback: vi.fn(),
  };
});

vi.mock('../../src/services/auth-session.services.mjs', () => ({
  createAuthSession: vi.fn(),
  revokeRefreshToken: vi.fn(),
  rotateAuthSession: vi.fn(),
}));

const app = express();
app.use(express.json());
app.use('/auth', authRoutes);

describe('Google Auth API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createAuthSession.mockResolvedValue({
      accessToken: 'access',
      refreshToken: 'refresh',
      csrfToken: 'csrf',
      user: {
        userId: 101,
        email: 'google-api@example.com',
        username: 'google_api_user',
        avatar: 'https://avatar.com/pic.jpg',
        role: 'user',
        branch_id: null,
        must_change_password: false,
      },
    });
  });

  describe('Initiator redirect', { tags: ['@A_R10'] }, () => {
    it('[TC-INT-GA-001] should redirect the browser to Google OAuth on GET /auth/google', async () => {
      const res = await request(app).get('/auth/google');
      expect(res.status).toBe(302);
      expect(res.headers.location).toContain('https://accounts.google.com/o/oauth2/v2/auth');
    });
  });

  describe('Successful callback', { tags: ['@A_R5', '@A_R6', '@A_R10'] }, () => {
    it('[TC-INT-GA-002] should create a session and redirect without exposing a token in the URL', async () => {
      const res = await request(app).get('/auth/google/callback');

      expect(res.status).toBe(302);
      expect(createAuthSession).toHaveBeenCalled();
      expect(res.headers.location).toBe(`${process.env.CLIENT_URL}/auth/callback`);
      expect(res.headers.location).not.toContain('token=');
    });
  });

});
