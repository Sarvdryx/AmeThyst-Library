import { vi, describe, it, expect, beforeEach } from 'vitest';
import { resendVerificationEmailService } from '../../src/services/auth.services.mjs';
import { resendVerification } from '../../src/controllers/auth.controllers.mjs';

vi.mock('../../src/services/auth.services.mjs', () => ({
  resendVerificationEmailService: vi.fn(),
  registerUser: vi.fn(),
  loginUser: vi.fn(),
  verifyEmail: vi.fn(),
}));

const RESEND_GENERIC = 'If a pending registration exists, a verification message will be sent.';

describe('Resend Verification Controller', () => {
  let req;
  let res;

  beforeEach(() => {
    vi.clearAllMocks();

    req = {
      body: {
        email: 'resend@example.com',
      },
    };

    res = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
  });

  describe('Successful and validation mapping', { tags: ['@A_R4', '@A_R10'] }, () => {
    it('[TC-CTL-RV-001] should pass through the generic 200 body', async () => {
      resendVerificationEmailService.mockResolvedValue({ message: RESEND_GENERIC });

      await resendVerification(req, res);

      expect(resendVerificationEmailService).toHaveBeenCalledWith({ email: 'resend@example.com' });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: RESEND_GENERIC });
    });

    it('[TC-CTL-RV-003] should reject a missing email with 400', async () => {
      req.body.email = undefined;
      await resendVerification(req, res);

      expect(resendVerificationEmailService).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Email is required' });
    });
  });

  describe('Infrastructure catch mapping', { tags: ['@A_R8', '@A_R10'] }, () => {
    it('[TC-CTL-RV-002] should return 200 with the generic message for an unexpected service failure', async () => {
      resendVerificationEmailService.mockRejectedValue(new Error('PostgreSQL database query failure'));

      await resendVerification(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: RESEND_GENERIC });
    });
  });
});
