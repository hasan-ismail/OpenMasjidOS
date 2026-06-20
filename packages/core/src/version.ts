/**
 * The single source of truth for the version is the repo-root VERSION file
 * (see CLAUDE.md §18). The Docker build copies it to /app/VERSION and points
 * OPENMASJID_VERSION_FILE at it; in dev we walk up to find it. Never hardcode
 * a version string anywhere else.
 */
import fs from 'node:fs';
import path from 'node:path';

function readVersion(): string {
  if (process.env.OPENMASJID_VERSION) return process.env.OPENMASJID_VERSION.trim();

  const candidates = [
    process.env.OPENMASJID_VERSION_FILE,
    path.resolve(__dirname, '../../../VERSION'), // repo root from packages/core/{src,dist}
    path.resolve(process.cwd(), 'VERSION'),
  ].filter((p): p is string => Boolean(p));

  for (const file of candidates) {
    try {
      const raw = fs.readFileSync(file, 'utf8').trim();
      if (raw) return raw;
    } catch {
      /* try the next candidate */
    }
  }
  return '0.0.0-dev';
}

export const VERSION = readVersion();
