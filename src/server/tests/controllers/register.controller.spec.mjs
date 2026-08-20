import { vi, describe, it, expect, beforeEach } from 'vitest';
import { registerUser } from '../../src/services/auth.services.mjs';
import { register } from '../../src/controllers/auth.controllers.mjs';

vi.mock('../../src/services/auth.services.mjs', () => ({
  registerUser: vi.fn(),
  loginUser: vi.fn(),
  verifyEmail: vi.fn(),
  resendVerificationEmailService: vi.fn(),
}));

const REGISTER_GENERIC = 'If this email can be registered, a verification message will be sent.';

describe('Register Controller', () => {
  let req;
  let res;

  beforeEach(() => {
    vi.clearAllMocks();

    req = {
      body: {
        email: 'student@example.com',
        password: 'Password123',
        username: 'student_user',
      },
    };

    res = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
  });

  describe('Successful mapping', { tags: ['@A_R1', '@A_R10'] }, () => {
    it('[TC-CTL-REG-001] should return 201 with the generic message and pass body fields to the service', async () => {
      registerUser.mockResolvedValue({ message: REGISTER_GENERIC });

      await register(req, res);

      expect(registerUser).toHaveBeenCalledWith({
        email: 'student@example.com',
        password: 'Password123',
        username: 'student_user',
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ message: REGISTER_GENERIC });
    });
  });

  describe('Anti-email-enumeration', { tags: ['@A_R2', '@A_R10'] }, () => {
    it('[TC-CTL-REG-002] should return 201 with the generic message when the service hides an existing account', async () => {
      registerUser.mockResolvedValue({ message: REGISTER_GENERIC });

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.status).not.toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({ message: REGISTER_GENERIC });
    });
  });

});
