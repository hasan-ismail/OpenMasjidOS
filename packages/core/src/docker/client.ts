/**
 * The single dockerode handle. All Docker Engine API access goes through here
 * (CLAUDE.md §15: no ad-hoc Docker access scattered around). The host socket is
 * mounted into the container by the installer's compose file.
 */
import Docker from 'dockerode';

const socketPath = process.env.DOCKER_SOCKET ?? '/var/run/docker.sock';

export const docker = new Docker({ socketPath });

/** Cheap reachability check used by readiness reporting. */
export async function dockerReachable(): Promise<boolean> {
  try {
    await docker.ping();
    return true;
  } catch {
    return false;
  }
}
