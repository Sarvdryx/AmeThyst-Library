import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const localesDir = path.join(__dirname, '../app/locales');
const enPath = path.join(localesDir, 'en.json');
const viPath = path.join(localesDir, 'vi.json');

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (err) {
    return {};
  }
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

function deepSync(source, target) {
  let changed = false;
  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      if (target[key] === undefined) {
        target[key] = source[key];
        changed = true;
      } else if (typeof source[key] === 'object' && source[key] !== null) {
        if (typeof target[key] !== 'object' || target[key] === null) {
          target[key] = {};
          changed = true;
        }
        if (deepSync(source[key], target[key])) {
          changed = true;
        }
      }
    }
  }
  return changed;
}

const en = readJson(enPath);
const vi = readJson(viPath);

const enChanged = deepSync(vi, en);
const viChanged = deepSync(en, vi);

if (enChanged) {
  writeJson(enPath, en);
  console.log('[i18n] Synchronized new keys from vi.json into en.json');
}
if (viChanged) {
  writeJson(viPath, vi);
  console.log('[i18n] Synchronized new keys from en.json into vi.json');
}

if (!enChanged && !viChanged) {
  console.log('[i18n] Translation files are already in sync.');
}
