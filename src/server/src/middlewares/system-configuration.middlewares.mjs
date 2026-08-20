import { validateSystemConfiguration } from '../utils/system-configuration.utils.mjs';

const validationResponse = (res, fields) => res.status(400).json({
  success: false,
  error: {
    code: 'CONFIG_VALIDATION_FAILED',
    message: 'One or more configuration values are invalid.',
    details: { fields },
  },
});

export const validateSystemConfigurationUpdate = (req, res, next) => {
  const body = req.body;
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return validationResponse(res, { request: 'MUST_BE_OBJECT' });
  }
  const keys = Object.keys(body);
  if (keys.length !== 2 || !keys.includes('expectedVersion') || !keys.includes('configuration')) {
    return validationResponse(res, { request: 'MUST_HAVE_EXACT_KEY_SET' });
  }
  if (typeof body.expectedVersion !== 'string' || body.expectedVersion.trim() === '') {
    return validationResponse(res, { expectedVersion: 'VALUE_REQUIRED' });
  }
  try {
    validateSystemConfiguration(body.configuration);
    return next();
  } catch (error) {
    if (error.code === 'CONFIG_VALIDATION_FAILED') return validationResponse(res, error.details.fields);
    return next(error);
  }
};
