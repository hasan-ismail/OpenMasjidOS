/**
 * Validates a docker-compose file before we ever run it (CLAUDE.md §11, §15).
 * Two outcomes:
 *   - parse failure  → hard error, nothing runs.
 *   - dangerous keys → list of human-readable warnings; the caller requires an
 *                      explicit "I understand the risk" acknowledgement.
 */
import YAML from 'yaml';

export interface ComposeCheck {
  /** Parsed object (only when the YAML is structurally valid). */
  parsed: Record<string, unknown> | null;
  /** Friendly descriptions of risky settings found. Empty = clean. */
  dangers: string[];
  /** Service names found, for display. */
  services: string[];
}

const SENSITIVE_HOST_PATHS = [
  '/',
  '/etc',
  '/root',
  '/home',
  '/var/run',
  '/var/run/docker.sock',
  '/proc',
  '/sys',
  '/boot',
];

export function checkCompose(text: string): ComposeCheck {
  let doc: unknown;
  try {
    doc = YAML.parse(text);
  } catch (err) {
    throw new Error(
      `We couldn't read that Compose file. Please check it's valid YAML. (${(err as Error).message})`,
    );
  }
  if (!doc || typeof doc !== 'object') {
    throw new Error("That doesn't look like a Compose file — it has no services.");
  }

  const parsed = doc as Record<string, unknown>;
  const services = (parsed.services ?? {}) as Record<string, Record<string, unknown>>;
  const names = Object.keys(services);
  if (names.length === 0) {
    throw new Error('That Compose file defines no services, so there is nothing to run.');
  }

  const dangers: string[] = [];
  for (const [name, svc] of Object.entries(services)) {
    if (!svc || typeof svc !== 'object') continue;

    if (svc.privileged === true) {
      dangers.push(`"${name}" runs in privileged mode (full access to this machine).`);
    }
    if (svc.network_mode === 'host') {
      dangers.push(`"${name}" uses host networking (shares the machine's network directly).`);
    }
    if (svc.pid === 'host') {
      dangers.push(`"${name}" shares the host process space.`);
    }
    const caps = svc.cap_add;
    if (Array.isArray(caps) && caps.map(String).some((c) => c.toUpperCase() === 'SYS_ADMIN')) {
      dangers.push(`"${name}" requests the powerful SYS_ADMIN capability.`);
    }
    const volumes = svc.volumes;
    if (Array.isArray(volumes)) {
      for (const v of volumes) {
        const src = typeof v === 'string' ? v.split(':')[0] : (v as { source?: string })?.source;
        if (!src) continue;
        const norm = src.trim();
        if (SENSITIVE_HOST_PATHS.includes(norm)) {
          dangers.push(`"${name}" mounts a sensitive host path: ${norm}`);
        }
        if (norm.endsWith('docker.sock')) {
          dangers.push(`"${name}" mounts the Docker socket (can control all containers).`);
        }
      }
    }
  }

  return { parsed, dangers, services: names };
}
