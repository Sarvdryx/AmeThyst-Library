import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));

export const DEFAULT_SYSTEM_CONFIGURATION_PATH = path.join(
  currentDirectory,
  'system-configuration.json',
);

export const resolveSystemConfigurationPath = (overridePath = process.env.SYSTEM_CONFIGURATION_PATH) => {
  if (overridePath === undefined || overridePath === null || String(overridePath).trim() === '') {
    return DEFAULT_SYSTEM_CONFIGURATION_PATH;
  }
  return path.resolve(String(overridePath).trim());
};
