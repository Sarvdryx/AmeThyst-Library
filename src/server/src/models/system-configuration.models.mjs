import path from 'node:path';
import { randomUUID } from 'node:crypto';
import * as defaultFileOperations from 'node:fs/promises';
import { resolveSystemConfigurationPath } from '../config/system-configuration.config.mjs';

export const createSystemConfigurationModel = ({
  filePath = resolveSystemConfigurationPath(),
  fileOperations = defaultFileOperations,
  beforeReplace = null,
} = {}) => {
  const canonicalPath = path.resolve(filePath);

  const load = async () => JSON.parse(await fileOperations.readFile(canonicalPath, 'utf8'));

  const replace = async (serializedConfiguration) => {
    const temporaryPath = path.join(
      path.dirname(canonicalPath),
      `.${path.basename(canonicalPath)}.${process.pid}.${randomUUID()}.tmp`,
    );
    let handle;
    try {
      handle = await fileOperations.open(temporaryPath, 'wx');
      await handle.writeFile(serializedConfiguration, 'utf8');
      await handle.sync();
      await handle.close();
      handle = null;
      if (beforeReplace) await beforeReplace({ temporaryPath, canonicalPath });
      await fileOperations.rename(temporaryPath, canonicalPath);
    } catch (error) {
      if (handle) try { await handle.close(); } catch { /* best effort */ }
      try { await fileOperations.unlink(temporaryPath); } catch { /* best effort */ }
      throw error;
    }
  };

  return Object.freeze({ filePath: canonicalPath, load, replace });
};

export const systemConfigurationModel = createSystemConfigurationModel();
