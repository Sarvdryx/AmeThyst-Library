import { systemConfigurationService } from '../services/system-configuration.services.mjs';

const errorResponse = (res, error) => res.status(error.status || 500).json({
  success: false,
  error: {
    code: error.code || 'INTERNAL_ERROR',
    message: error.message || 'An unexpected error occurred.',
    ...(error.details ? { details: error.details } : {}),
  },
});

export const createSystemConfigurationControllers = (service = systemConfigurationService) => ({
  getSystemConfiguration: async (_req, res) => {
    try {
      return res.status(200).json({ success: true, data: service.getState() });
    } catch (error) {
      return errorResponse(res, error);
    }
  },
  updateSystemConfiguration: async (req, res) => {
    try {
      const state = await service.update(req.body.configuration, req.body.expectedVersion);
      return res.status(200).json({ success: true, message: 'System configuration updated successfully.', data: state });
    } catch (error) {
      return errorResponse(res, error);
    }
  },
});

const defaultControllers = createSystemConfigurationControllers();
export const getSystemConfiguration = defaultControllers.getSystemConfiguration;
export const updateSystemConfiguration = defaultControllers.updateSystemConfiguration;
