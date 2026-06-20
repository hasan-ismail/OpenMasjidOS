/**
 * Password hashing with argon2id. We use @node-rs/argon2 (prebuilt musl/glibc
 * binaries) rather than the native `argon2` package so the multi-arch Alpine
 * image builds with no compilation — see docs/ARCHITECTURE.md. Same algorithm.
 */
import { hash, verify, Algorithm } from '@node-rs/argon2';

const OPTIONS = {
  algorithm: Algorithm.Argon2id,
  // OWASP-ish defaults: 19 MiB memory, 2 iterations, single lane.
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
};

export async function hashPassword(plain: string): Promise<string> {
  return hash(plain, OPTIONS);
}

export async function verifyPassword(digest: string, plain: string): Promise<boolean> {
  try {
    return await verify(digest, plain);
  } catch {
    // A malformed stored hash should fail closed, never throw to the caller.
    return false;
  }
}

/** Minimum admin password length enforced server-side (also enforced in the UI). */
export const MIN_PASSWORD_LENGTH = 8;
