/**
 * The admin account store. There is exactly one admin in v1.0 (CLAUDE.md §9).
 * The password is only ever held as an argon2id hash; the plaintext never
 * touches disk or the logs.
 */
import path from 'node:path';
import { CONFIG_DIR } from '../config';
import { readJson, writeJson } from '../util/json-store';

interface AuthFile {
  username: string | null;
  passwordHash: string | null;
}

const AUTH_PATH = path.join(CONFIG_DIR, 'auth.json');
const DEFAULTS: AuthFile = { username: null, passwordHash: null };

let cache: AuthFile = readJson(AUTH_PATH, DEFAULTS);

/** Whether an admin account has been created yet (drives the first-run flow). */
export function isConfigured(): boolean {
  return Boolean(cache.username && cache.passwordHash);
}

export function getUsername(): string | null {
  return cache.username;
}

export function getPasswordHash(): string | null {
  return cache.passwordHash;
}

/** Create or replace the admin credentials. */
export function setCredentials(username: string, passwordHash: string): void {
  cache = { username, passwordHash };
  writeJson(AUTH_PATH, cache);
}

/** Replace only the password hash, keeping the username. */
export function updatePasswordHash(passwordHash: string): void {
  cache = { ...cache, passwordHash };
  writeJson(AUTH_PATH, cache);
}
