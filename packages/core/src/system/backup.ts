/**
 * Backup = a gzipped tar of platform config + per-app data, streamed straight
 * to the browser (CLAUDE.md §13.3). It is read-only over the data dir, so it
 * can never harm a running app. Restore is handled separately and conservatively
 * (it overwrites data, so it is gated in the UI).
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import type { Readable } from 'node:stream';
import { DATA_DIR } from '../config';

/**
 * Produce a tar.gz stream of the data dir's `config` and `apps` folders.
 * Returns the child's stdout stream (the caller pipes it to the HTTP reply).
 */
export function backupStream(): Readable {
  const targets: string[] = [];
  for (const dir of ['config', 'apps']) {
    if (fs.existsSync(`${DATA_DIR}/${dir}`)) targets.push(dir);
  }
  // If nothing exists yet, tar an empty marker so the download still succeeds.
  const args =
    targets.length > 0
      ? ['-czf', '-', '-C', DATA_DIR, ...targets]
      : ['-czf', '-', '-C', DATA_DIR, '.'];
  const child = spawn('tar', args);
  // stdout is a pipe here (we didn't override stdio), so it's always a stream.
  return child.stdout as Readable;
}

/** A friendly, sortable default filename for the download. */
export function backupFilename(): string {
  const d = new Date().toISOString().slice(0, 10);
  return `openmasjidos-backup-${d}.tar.gz`;
}
