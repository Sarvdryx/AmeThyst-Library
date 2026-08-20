export const DAMAGE_CONDITION_KEYS = Object.freeze([
  'perfect_condition', 'slight_cover_scratches', 'folded_pages', 'pencil_marks',
  'ink_marks', 'torn_pages', 'water_damage', 'damaged_binding', 'missing_mats',
  'missing_pages', 'lost',
]);

const TOP_LEVEL_KEYS = Object.freeze([
  'MAX_BORROW_LIMIT', 'FEE_ADMIN', 'FEE_ADDON', 'DAMAGE_COEFFICIENTS',
]);

export class SystemConfigurationValidationError extends Error {
  constructor(fields) {
    super('One or more configuration values are invalid.');
    this.name = 'SystemConfigurationValidationError';
    this.code = 'CONFIG_VALIDATION_FAILED';
    this.status = 400;
    this.details = { fields };
  }
}

const hasExactKeys = (value, expectedKeys) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const keys = Object.keys(value);
  return keys.length === expectedKeys.length && expectedKeys.every((key) => keys.includes(key));
};

const validateRequiredNumber = (value, fieldPath, errors) => {
  if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) {
    errors[fieldPath] = 'VALUE_REQUIRED';
    return;
  }
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    errors[fieldPath] = 'MUST_BE_NON_NEGATIVE_FINITE_NUMBER';
  }
};

export const validateSystemConfiguration = (configuration) => {
  const errors = {};
  if (!hasExactKeys(configuration, TOP_LEVEL_KEYS)) errors.configuration = 'MUST_HAVE_EXACT_KEY_SET';

  const maxBorrowLimit = configuration?.MAX_BORROW_LIMIT;
  if (maxBorrowLimit === null || maxBorrowLimit === undefined || (typeof maxBorrowLimit === 'string' && maxBorrowLimit.trim() === '')) {
    errors.MAX_BORROW_LIMIT = 'VALUE_REQUIRED';
  } else if (!Number.isInteger(maxBorrowLimit) || maxBorrowLimit < 1) {
    errors.MAX_BORROW_LIMIT = 'MUST_BE_POSITIVE_INTEGER';
  }

  validateRequiredNumber(configuration?.FEE_ADMIN, 'FEE_ADMIN', errors);
  validateRequiredNumber(configuration?.FEE_ADDON, 'FEE_ADDON', errors);

  const coefficients = configuration?.DAMAGE_COEFFICIENTS;
  if (!hasExactKeys(coefficients, DAMAGE_CONDITION_KEYS)) errors.DAMAGE_COEFFICIENTS = 'MUST_HAVE_EXACT_KEY_SET';
  for (const condition of DAMAGE_CONDITION_KEYS) {
    validateRequiredNumber(coefficients?.[condition], `DAMAGE_COEFFICIENTS.${condition}`, errors);
  }
  if (coefficients?.perfect_condition !== undefined && coefficients.perfect_condition !== 0) {
    errors['DAMAGE_COEFFICIENTS.perfect_condition'] = 'MUST_EQUAL_ZERO';
  }
  if (Object.keys(errors).length > 0) throw new SystemConfigurationValidationError(errors);
  return configuration;
};

export const toCanonicalSystemConfiguration = (configuration) => {
  validateSystemConfiguration(configuration);
  return {
    MAX_BORROW_LIMIT: configuration.MAX_BORROW_LIMIT,
    FEE_ADMIN: configuration.FEE_ADMIN,
    FEE_ADDON: configuration.FEE_ADDON,
    DAMAGE_COEFFICIENTS: Object.fromEntries(
      DAMAGE_CONDITION_KEYS.map((key) => [key, configuration.DAMAGE_COEFFICIENTS[key]]),
    ),
  };
};

export const serializeSystemConfiguration = (configuration) => (
  `${JSON.stringify(toCanonicalSystemConfiguration(configuration), null, 2)}\n`
);

export const deepFreeze = (value) => {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.freeze(value);
  Object.values(value).forEach(deepFreeze);
  return value;
};

export const cloneSystemConfiguration = (configuration) => (
  toCanonicalSystemConfiguration(structuredClone(configuration))
);
