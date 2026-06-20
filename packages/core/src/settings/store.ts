/**
 * Platform settings — NEVER masjid/prayer config (that belongs to apps,
 * CLAUDE.md §13). Presentation prefs (theme, accent, wallpaper, language) live
 * client-side in the browser; the only settings the SERVER must own are the
 * security-relevant ones, chiefly the custom-apps gate.
 */
import path from 'node:path';
import { CONFIG_DIR } from '../config';
import { readJson, writeJson } from '../util/json-store';

export interface PlatformSettings {
  /** Gates the App Store "3rd Party App" button. Off by default (CLAUDE.md §11). */
  allowCustomApps: boolean;
  /** Update channel for the core itself. */
  updateChannel: 'stable' | 'beta';
}

const SETTINGS_PATH = path.join(CONFIG_DIR, 'settings.json');
const DEFAULTS: PlatformSettings = { allowCustomApps: false, updateChannel: 'stable' };

let cache: PlatformSettings = readJson(SETTINGS_PATH, DEFAULTS);

export function getSettings(): PlatformSettings {
  return cache;
}

export function updateSettings(patch: Partial<PlatformSettings>): PlatformSettings {
  cache = { ...cache, ...patch };
  writeJson(SETTINGS_PATH, cache);
  return cache;
}
