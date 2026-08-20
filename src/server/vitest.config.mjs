import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    strictTags: false,

    projects: [
      {
        test: {
          name: 'test_auth_register',
          globals: true,
          strictTags: false,
          include: [
            'tests/config/googleAuth.strategy.spec.mjs',
            'tests/services/register.service.spec.mjs',
            'tests/services/verifyEmail.service.spec.mjs',
            'tests/services/resendVerification.service.spec.mjs',
            'tests/controllers/register.controller.spec.mjs',
            'tests/controllers/verifyEmail.controller.spec.mjs',
            'tests/controllers/resendVerification.controller.spec.mjs',
            'tests/controllers/googleAuth.controller.spec.mjs',
            'tests/integration/register.api.spec.mjs',
            'tests/integration/verifyEmail.api.spec.mjs',
            'tests/integration/resendVerification.api.spec.mjs',
            'tests/integration/googleAuth.api.spec.mjs',
          ],
          tags: [
            { name: '@A_R1', description: 'Successful End-to-End Registration (Register → Verify → JWT Issued)' },
            { name: '@A_R2', description: 'Reject Duplicate Email Across Entry Points' },
            { name: '@A_R3', description: 'Pending-Registration and Verification-Token TTL Lifecycle' },
            { name: '@A_R4', description: 'Resend Verification Email (TTL Refresh & Re-use)' },
            { name: '@A_R5', description: 'Google OAuth First-Time Sign-In (Auto-Provisioning)' },
            { name: '@A_R6', description: 'Google OAuth Returning User' },
            { name: '@A_R7', description: 'Security and Data-Shape Invariants Across All Flows' },
            { name: '@A_R8', description: 'Infrastructure Failure Handling' },
            { name: '@A_R9', description: 'Transactional Consistency & Boundaries' },
            { name: '@A_R10', description: 'HTTP Response and Redirect Matrix Mapping' },
          ],
        },
      },

      {
        test: {
          name: 'test_library_reserve',
          globals: true,
          strictTags: false,
          include: [
            'tests/services/library.reserve.service.spec.mjs',
            'tests/controllers/library.reserve.controller.spec.mjs',
            'tests/middlewares/library.reserve.middleware.spec.mjs',
          ],
        },
      },

      {
        test: {
          name: 'test_pin_verification',
          globals: true,
          strictTags: false,
          include: [
            'tests/services/dashboard.user.pin.service.spec.mjs',
            'tests/services/dashboard.librarian.pin.service.spec.mjs',
            'tests/controllers/dashboard.user.pin.controller.spec.mjs',
            'tests/controllers/dashboard.librarian.pin.controller.spec.mjs',
          ],
        },
      },

      {
        test: {
          name: 'test_study_group',
          globals: true,
          strictTags: false,
          include: [
            'tests/services/study-group.services.spec.mjs',
            'tests/controllers/createStudyGroup.controller.spec.mjs',
            'tests/integration/createStudyGroup.api.spec.mjs',
            'tests/middlewares/createStudyGroup.middleware.spec.mjs',
            'tests/services/createStudyGroup.service.spec.mjs',
          ],
          tags: [
            { name: '@SG_1', description: 'Atomic Study Group and reservation creation' },
            { name: '@SG_2', description: 'Elapsed or unavailable slot rejection' },
            { name: '@SG_3', description: 'Join retry after denial cooldown' },
            { name: '@SG_4', description: 'Duplicate active participation rejection' },
            { name: '@SG_5', description: 'Request approval and capacity reconciliation' },
            { name: '@SG_6', description: 'Request and invitation operation separation' },
            { name: '@SG_7', description: 'Invitee role restriction' },
            { name: '@SG_8', description: 'Invitation SMTP compensation' },
            { name: '@SG_9', description: 'Invitation recipient authorization and acceptance' },
            { name: '@SG_10', description: 'Transactional group dissolution and notifications' },
            { name: '@SG_CREATE_CONTROLLER', description: 'Create Study Group controller response and realtime mapping' },
            { name: '@SG_CREATE_API', description: 'Create Study Group HTTP route integration' },
            { name: '@SG_CREATE_NORMALIZATION', description: 'Create Study Group metadata normalization' },
            { name: '@SG_CREATE_VALIDATION', description: 'Create Study Group input validation' },
            { name: '@SG_CREATE_SLOT', description: 'Create Study Group authoritative slot validation' },
            { name: '@SG_CREATE_ATOMIC', description: 'Create Study Group atomic persistence orchestration' },
            { name: '@SG_CREATE_ERRORS', description: 'Create Study Group persistence error mapping' },
          ],
        },
      },
      {
        test: {
          name: 'test_recommendation',
          globals: true,
          strictTags: false,
          include: ['tests/services/recommendation.services.spec.mjs'],
        },
      },
    ],

    api: {
      host: '127.0.0.1',
      port: 8080,
    },
  },
});
