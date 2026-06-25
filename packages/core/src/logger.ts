// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 OpenMasjid-Solutions
/**
 * A deliberately tiny structured logger. We never log secrets (passwords,
 * session tokens, cookie values) — see CLAUDE.md §15.
 */
type Level = 'debug' | 'info' | 'warn' | 'error';

function emit(level: Level, msg: string, extra?: unknown) {
  const ts = new Date().toISOString();
  const line = `${ts} ${level.toUpperCase().padEnd(5)} ${msg}`;
  const stream = level === 'error' || level === 'warn' ? console.error : console.log;
  if (extra !== undefined) stream(line, extra);
  else stream(line);
}

export const log = {
  debug: (msg: string, extra?: unknown) => {
    if (process.env.OPENMASJID_LOG_LEVEL === 'debug') emit('debug', msg, extra);
  },
  info: (msg: string, extra?: unknown) => emit('info', msg, extra),
  warn: (msg: string, extra?: unknown) => emit('warn', msg, extra),
  error: (msg: string, extra?: unknown) => emit('error', msg, extra),
};
