/**
 * Thin wrapper around the `docker compose` plugin. This is the ONE place we
 * shell out (CLAUDE.md §15) — every app lifecycle action funnels through here.
 *
 * Project naming: each app is its own compose project `omos-<id>`. The core's
 * own project is `openmasjid` and is managed by the installer, never here — so
 * nothing in this file can ever touch the core or a user's other containers.
 *
 * Many actions (stop/start/restart/logs/down) accept just the project name and
 * operate via Docker's compose labels, so they still work for an "orphan" app
 * whose on-disk compose file was lost — see CLAUDE.md golden rule (§8.1).
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import { log } from '../logger';

export interface RunResult {
  code: number;
  stdout: string;
  stderr: string;
}

/** Run `docker <args>` and capture output. Never rejects on non-zero exit. */
function run(args: string[], cwd?: string): Promise<RunResult> {
  return new Promise((resolve) => {
    const child = spawn('docker', args, { cwd });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => (stdout += d.toString()));
    child.stderr.on('data', (d) => (stderr += d.toString()));
    child.on('error', (err) => resolve({ code: -1, stdout, stderr: stderr + String(err) }));
    child.on('close', (code) => resolve({ code: code ?? -1, stdout, stderr }));
  });
}

function fileArgs(composeFile?: string): string[] {
  return composeFile && fs.existsSync(composeFile) ? ['-f', composeFile] : [];
}

/** `docker compose -p <project> [-f file] up -d` */
export async function composeUp(
  project: string,
  composeFile: string,
  envFile?: string,
): Promise<RunResult> {
  const args = ['compose', '-p', project, ...fileArgs(composeFile)];
  if (envFile && fs.existsSync(envFile)) args.push('--env-file', envFile);
  args.push('up', '-d', '--remove-orphans');
  log.info(`compose up: ${project}`);
  return run(args);
}

export async function composeStop(project: string): Promise<RunResult> {
  return run(['compose', '-p', project, 'stop']);
}

export async function composeStart(project: string): Promise<RunResult> {
  return run(['compose', '-p', project, 'start']);
}

export async function composeRestart(project: string): Promise<RunResult> {
  return run(['compose', '-p', project, 'restart']);
}

/** `docker compose -p <project> down [-v]`. Removes the app's containers. */
export async function composeDown(
  project: string,
  composeFile?: string,
  removeVolumes = false,
): Promise<RunResult> {
  const args = ['compose', '-p', project, ...fileArgs(composeFile), 'down'];
  if (removeVolumes) args.push('-v');
  log.info(`compose down: ${project} (volumes: ${removeVolumes})`);
  return run(args);
}

export async function composeLogs(project: string, tail = 200): Promise<string> {
  const res = await run(['compose', '-p', project, 'logs', '--no-color', `--tail=${tail}`]);
  return (res.stdout + res.stderr).trim();
}

/** Validate a compose file parses + resolves without starting anything. */
export async function composeConfig(composeFile: string): Promise<RunResult> {
  return run(['compose', '-f', composeFile, 'config', '--quiet']);
}
