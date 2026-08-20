import { createHash } from 'node:crypto';
import { systemConfigurationModel } from '../models/system-configuration.models.mjs';
import {
  cloneSystemConfiguration, deepFreeze, serializeSystemConfiguration, toCanonicalSystemConfiguration,
} from '../utils/system-configuration.utils.mjs';

export class SystemConfigurationError extends Error {
  constructor(code, message, status = 503, details = undefined, cause = undefined) {
    super(message, { cause });
    this.name = 'SystemConfigurationError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

const deriveVersion = (serialized) => createHash('sha256').update(serialized).digest('hex');

export const createSystemConfigurationService = ({ model = systemConfigurationModel } = {}) => {
  let activeSnapshot = null;
  let activeVersion = null;
  let writeQueue = Promise.resolve();

  const assertAvailable = () => {
    if (!activeSnapshot || !activeVersion) {
      throw new SystemConfigurationError('CONFIG_UNAVAILABLE', 'System configuration is unavailable.', 503);
    }
  };

  const getSnapshot = () => { assertAvailable(); return activeSnapshot; };
  const getState = () => {
    assertAvailable();
    return { configuration: cloneSystemConfiguration(activeSnapshot), version: activeVersion };
  };

  const initialize = async () => {
    try {
      const canonical = toCanonicalSystemConfiguration(await model.load());
      activeSnapshot = deepFreeze(canonical);
      activeVersion = deriveVersion(serializeSystemConfiguration(canonical));
      return getState();
    } catch (error) {
      activeSnapshot = null;
      activeVersion = null;
      throw new SystemConfigurationError('CONFIG_UNAVAILABLE', 'System configuration could not be loaded.', 503, undefined, error);
    }
  };

  const performUpdate = async (configuration, expectedVersion) => {
    assertAvailable();
    if (typeof expectedVersion !== 'string' || expectedVersion !== activeVersion) {
      throw new SystemConfigurationError(
        'CONFIG_VERSION_CONFLICT',
        'System configuration changed after this page was loaded. Reload and review the latest values.',
        409,
        { currentVersion: activeVersion },
      );
    }
    const canonical = toCanonicalSystemConfiguration(configuration);
    const serialized = serializeSystemConfiguration(canonical);
    const nextVersion = deriveVersion(serialized);
    if (nextVersion === activeVersion) return getState();
    try {
      await model.replace(serialized);
    } catch (error) {
      throw new SystemConfigurationError('CONFIG_WRITE_FAILED', 'System configuration could not be saved. No changes were applied.', 503, undefined, error);
    }
    activeSnapshot = deepFreeze(canonical);
    activeVersion = nextVersion;
    return getState();
  };

  const update = (configuration, expectedVersion) => {
    const operation = writeQueue.then(() => performUpdate(configuration, expectedVersion));
    writeQueue = operation.catch(() => undefined);
    return operation;
  };

  return Object.freeze({ initialize, getSnapshot, getState, update });
};

export const systemConfigurationService = createSystemConfigurationService();
